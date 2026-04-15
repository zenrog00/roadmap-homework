import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BalanceRepository } from './balance.repository';
import { UsersService } from '../users.service';

@Injectable()
export class BalanceService {
  constructor(
    private readonly balanceRepository: BalanceRepository,
    private readonly usersService: UsersService,
  ) {}

  async createDeposit(userId: string, amount: string) {
    const res = await this.balanceRepository.changeBalance(userId, amount);
    if (!res) {
      throw new NotFoundException("User's not found!");
    }
    return res;
  }

  async createWithdrawal(userId: string, amount: string) {
    const operationSign = '-';
    const delta = `${operationSign}${amount}`;

    const res = await this.balanceRepository.changeBalance(userId, delta);

    if (!res) {
      const user = await this.usersService.findOneBy({ id: userId });
      if (!user) {
        throw new NotFoundException("User's not found!");
      }
      throw new BadRequestException('Insufficient balance!');
    }

    return res;
  }
}
