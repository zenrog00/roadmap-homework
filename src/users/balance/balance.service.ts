import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  ApplyIdempotentBalanceOperationInput,
  SaveSuccessfulOperationInput,
} from './types';
import { BalanceRepository, BalanceOperationsRepository } from './repositories';
import { UsersService } from '../users.service';
import { Transactional } from 'typeorm-transactional';
import { BalanceResponseDto } from './dtos';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class BalanceService {
  private readonly logger = new Logger(BalanceService.name);

  private readonly balanceJobSchedulerName = 'balance';
  private readonly balanceResetJobName = 'reset-global';
  private readonly balanceResetJobIntervalMs = 10 * 60 * 1000; // 10 min

  constructor(
    private readonly balanceRepository: BalanceRepository,
    private readonly balanceOperationsRepository: BalanceOperationsRepository,
    private readonly usersService: UsersService,
    @InjectQueue('balance') private readonly balanceQueue: Queue,
  ) {}

  @Transactional()
  async createDeposit(
    userId: string,
    amount: string,
    idempotencyKey: string,
    counterpartyUserId = userId,
  ): Promise<BalanceResponseDto> {
    const balance = await this.applyIdempotentBalanceOperation({
      userId,
      counterpartyUserId,
      idempotencyKey,
      operationType: 'deposit',
      amount,
    });
    if (!balance) {
      throw new NotFoundException("User's not found!");
    }

    return balance;
  }

  @Transactional()
  async createWithdrawal(
    userId: string,
    amount: string,
    idempotencyKey: string,
    counterpartyUserId = userId,
  ): Promise<BalanceResponseDto> {
    const balance = await this.applyIdempotentBalanceOperation({
      userId,
      counterpartyUserId,
      idempotencyKey,
      operationType: 'withdrawal',
      amount,
    });
    if (!balance) {
      const user = await this.usersService.findOneBy({ id: userId });
      if (!user) {
        throw new NotFoundException("User's not found!");
      }
      throw new BadRequestException('Insufficient balance!');
    }

    return balance;
  }

  @Transactional()
  async createTransfer(
    userId: string,
    counterpartyUserId: string,
    amount: string,
    idempotencyKey: string,
  ): Promise<BalanceResponseDto> {
    if (userId === counterpartyUserId) {
      throw new BadRequestException('Cannot transfer to yourself!');
    }

    await this.lockTransferUsersForUpdate(userId, counterpartyUserId);

    const senderBalance = await this.createWithdrawal(
      userId,
      amount,
      idempotencyKey,
      counterpartyUserId,
    );

    try {
      await this.createDeposit(
        counterpartyUserId,
        amount,
        idempotencyKey,
        userId,
      );
    } catch (err) {
      if (err instanceof NotFoundException) {
        throw new NotFoundException('Recipient user not found!');
      }
      throw err;
    }

    return senderBalance;
  }

  async getBalance(userId: string): Promise<BalanceResponseDto> {
    const balance = await this.balanceRepository.getBalance(userId);
    if (!balance) {
      throw new NotFoundException("User's not found!");
    }
    return balance;
  }

  async startBalanceResetJob() {
    try {
      await this.balanceQueue.upsertJobScheduler(
        this.balanceJobSchedulerName,
        {
          every: this.balanceResetJobIntervalMs,
        },
        {
          name: this.balanceResetJobName,
        },
      );
      this.logger.log(
        `Created repeatable job for resetting users' balances with ${this.balanceResetJobIntervalMs}ms interval`,
      );
    } catch (err) {
      const errMessage = err instanceof Error ? err.message : String(err);
      const logMessage = `Failed to create repeatable job for resetting user's balances`;
      this.logger.warn(`${logMessage} \n${errMessage}`);
      throw new InternalServerErrorException(logMessage);
    }
  }

  private async applyIdempotentBalanceOperation({
    userId,
    counterpartyUserId,
    idempotencyKey,
    operationType,
    amount,
  }: ApplyIdempotentBalanceOperationInput): Promise<
    BalanceResponseDto | undefined
  > {
    const normalizedAmount = this.normalizeAmount(amount);
    const delta =
      operationType === 'withdrawal'
        ? `-${normalizedAmount}`
        : normalizedAmount;

    await this.balanceOperationsRepository.acquireIdempotencyLock(
      userId,
      idempotencyKey,
    );

    const existingOperation = await this.balanceOperationsRepository.findOneBy({
      userId,
      idempotencyKey,
    });
    if (existingOperation) {
      const hasSamePayload =
        existingOperation.operationType === operationType &&
        this.normalizeAmount(existingOperation.amount) === normalizedAmount &&
        existingOperation.counterpartyUserId === counterpartyUserId;
      if (!hasSamePayload) {
        throw new ConflictException(
          'Idempotency key already used with different payload!',
        );
      }

      return { balance: existingOperation.resultBalance };
    }

    const updatedBalance = await this.balanceRepository.changeBalance(
      userId,
      delta,
    );
    if (!updatedBalance) {
      return;
    }

    await this.saveSuccessfulOperation({
      userId,
      counterpartyUserId,
      idempotencyKey,
      operationType,
      amount: normalizedAmount,
      resultBalance: updatedBalance.balance,
    });

    return updatedBalance;
  }

  // locking both users in deterministic order.
  // because without sorting, opposite transfers (A->B and B->A) can deadlock
  // tx1 locks A when updating balance in transaction and waits for B
  // while tx2 locks B and waits for A.
  private async lockTransferUsersForUpdate(
    senderUserId: string,
    counterpartyUserId: string,
  ) {
    const [firstUserId, secondUserId] = [senderUserId, counterpartyUserId].sort(
      (a, b) => a.localeCompare(b),
    );

    await this.usersService.lockUserForUpdate(firstUserId);
    await this.usersService.lockUserForUpdate(secondUserId);
  }

  private async saveSuccessfulOperation(
    operation: SaveSuccessfulOperationInput,
  ) {
    await this.balanceOperationsRepository.save(operation);
  }

  // preventing cases when first amount is 12 and second is 12.00
  private normalizeAmount(amount: string) {
    const [integer, fraction = ''] = amount.split('.');
    const normalizedInteger = BigInt(integer).toString();
    const normalizedFraction = `${fraction}00`.slice(0, 2);

    return `${normalizedInteger}.${normalizedFraction}`;
  }
}
