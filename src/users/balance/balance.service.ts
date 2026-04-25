import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  ApplyIdempotentBalanceOperationInput,
  BALANCE_OPERATION,
  SaveSuccessfulOperationInput,
} from './types';
import { BalanceRepository, BalanceOperationsRepository } from './repositories';
import { UsersService } from '../users.service';
import { Transactional } from 'typeorm-transactional';
import { BalanceResponseDto } from './dtos';

@Injectable()
export class BalanceService {
  private readonly logger = new Logger(BalanceService.name);

  constructor(
    private readonly balanceRepository: BalanceRepository,
    private readonly balanceOperationsRepository: BalanceOperationsRepository,
    private readonly usersService: UsersService,
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
      this.logger.warn(`Deposit failed: user not found userId=${userId}`);
      throw new NotFoundException("User's not found!");
    }

    this.logger.log(
      `Deposit applied userId=${userId} amount=${amount} idempotencyKey=${idempotencyKey}`,
    );
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
        this.logger.warn(`Withdrawal failed: user not found userId=${userId}`);
        throw new NotFoundException("User's not found!");
      }
      this.logger.warn(
        `Withdrawal rejected: insufficient balance userId=${userId} amount=${amount} idempotencyKey=${idempotencyKey}`,
      );
      throw new BadRequestException('Insufficient balance!');
    }

    this.logger.log(
      `Withdrawal applied userId=${userId} amount=${amount} idempotencyKey=${idempotencyKey} counterpartyUserId=${counterpartyUserId}`,
    );
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
      this.logger.warn(
        `Transfer rejected: sender and recipient are the same userId=${userId}`,
      );
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
        this.logger.warn(
          `Transfer failed: recipient not found senderUserId=${userId} counterpartyUserId=${counterpartyUserId} amount=${amount}`,
        );
        throw new NotFoundException('Recipient user not found!');
      }
      throw err;
    }

    this.logger.log(
      `Transfer completed fromUserId=${userId} toUserId=${counterpartyUserId} amount=${amount} idempotencyKey=${idempotencyKey}`,
    );
    return senderBalance;
  }

  async getBalance(userId: string): Promise<BalanceResponseDto> {
    const balance = await this.balanceRepository.getBalance(userId);
    if (!balance) {
      throw new NotFoundException("User's not found!");
    }
    return balance;
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
      operationType === BALANCE_OPERATION.WITHDRAWAL
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
        this.logger.warn(
          `Idempotency conflict userId=${userId} key=${idempotencyKey}: replay with different payload (existing type=${existingOperation.operationType})`,
        );
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
