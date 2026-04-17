import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities';
import { BalanceResponseDto } from '../dtos';

@Injectable()
export class BalanceRepository {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
  ) {}

  async changeBalance(
    userId: string,
    delta: string,
  ): Promise<BalanceResponseDto | undefined> {
    const query = this.usersRepository
      .createQueryBuilder()
      .update(User)
      .set({ balance: () => `balance + :delta` })
      .where('id = :userId', { userId })
      .andWhere(`"deletedAt" IS NULL`);

    // withdrawing balance
    if (delta.startsWith('-')) {
      query.andWhere('balance >= :amount', {
        amount: delta.slice(1),
      });
    }

    const res = await query
      .setParameters({ delta })
      .returning(['balance'])
      .execute();

    const returned = res.raw as BalanceResponseDto[];
    return returned[0];
  }

  async getBalance(userId: string): Promise<BalanceResponseDto | undefined> {
    return await this.usersRepository
      .createQueryBuilder('user')
      .select('user.balance', 'balance')
      .where('user.id = :userId', { userId })
      .andWhere('user.deletedAt IS NULL')
      .getRawOne<BalanceResponseDto>();
  }

  async resetAllBalances(): Promise<number> {
    const res = await this.usersRepository
      .createQueryBuilder()
      .update(User)
      .set({ balance: '0.00' })
      .where(`"deletedAt" IS NULL`)
      .execute();

    return res.affected ?? 0;
  }

  async resetBalancesByUserIds(userIds: string[]): Promise<number> {
    if (!userIds.length) {
      return 0;
    }

    const res = await this.usersRepository
      .createQueryBuilder()
      .update(User)
      .set({ balance: '0.00' })
      .where('id IN (:...userIds)', { userIds })
      .andWhere(`"deletedAt" IS NULL`)
      .execute();

    return res.affected ?? 0;
  }
}
