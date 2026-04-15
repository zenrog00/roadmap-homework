import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entities';
import { UsersRepository } from '../users.repository';

@Injectable()
export class BalanceRepository {
  constructor(
    @InjectRepository(User) private readonly usersRepository: UsersRepository,
  ) {}

  async createDeposit(userId: string, amount: string) {
    const res = await this.usersRepository
      .createQueryBuilder()
      .update(User)
      .set({ balance: () => `balance + :amount` })
      .where('id = :userId', { userId })
      .andWhere(`"deletedAt" IS NULL`)
      .setParameters({ amount })
      .execute();

    return Boolean(res.affected);
  }
}
