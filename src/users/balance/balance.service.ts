import { Injectable, NotFoundException } from '@nestjs/common';
import { BalanceRepository } from './balance.repository';
import { Transactional } from 'typeorm-transactional';
import { UsersService } from '../users.service';

@Injectable()
export class BalanceService {
  constructor(
    private readonly balanceRepository: BalanceRepository,
    private readonly usersService: UsersService,
  ) {}

  @Transactional()
  async createDeposit(userId: string, amount: string) {
    const res = await this.balanceRepository.createDeposit(userId, amount);
    if (!res) {
      throw new NotFoundException("User's not found!");
    }
  }
}
