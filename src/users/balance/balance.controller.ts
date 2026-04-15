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
    await this.balanceService.createDeposit(userId, amount);
  }
}
