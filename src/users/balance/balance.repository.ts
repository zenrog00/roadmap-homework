import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entities';
import { UsersRepository } from '../users.repository';

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

    const res = await query.setParameters({ delta }).execute();
    return Boolean(res.affected);
  }
}
