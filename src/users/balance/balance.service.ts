import {
  BadRequestException,
  ConflictException,
  Injectable,
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

@Injectable()
export class BalanceService {
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
