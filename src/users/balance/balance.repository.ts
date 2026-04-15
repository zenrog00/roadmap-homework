import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entities';
import { UsersRepository } from '../users.repository';
import { BalanceResponseDto } from './dtos';

@Injectable()
export class BalanceRepository {
  constructor(
    @InjectRepository(User) private readonly usersRepository: UsersRepository,
  ) {}

  async changeBalance(userId: string, delta: string) {
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
}
