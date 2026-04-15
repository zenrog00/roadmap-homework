import { Body, Controller, Post, ValidationPipe } from '@nestjs/common';
import { User } from 'src/common/decorators';
import { BalanceOperationDto } from './dtos/balance-operation.dto';
import { BalanceService } from './balance.service';

@Controller('my/balance')
export class BalanceController {
  constructor(private readonly balanceService: BalanceService) {}

  @Post('deposits')
  async createDeposit(
    @User('id') userId: string,
    @Body(ValidationPipe) { amount }: BalanceOperationDto,
  ) {
    return await this.balanceService.createDeposit(userId, amount);
  }

  @Post('withdrawals')
  async createWithdrawal(
    @User('id') userId: string,
    @Body(ValidationPipe) { amount }: BalanceOperationDto,
  ) {
    return await this.balanceService.createWithdrawal(userId, amount);
  }
}
