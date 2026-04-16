import {
  Body,
  Controller,
  Get,
  ParseUUIDPipe,
  Post,
  ValidationPipe,
} from '@nestjs/common';
import { IdempotencyKey, User } from 'src/common/decorators';
import { BalanceOperationDto } from './dtos/balance-operation.dto';
import { BalanceService } from './balance.service';

@Controller('my/balance')
export class BalanceController {
  constructor(private readonly balanceService: BalanceService) {}

  @Post('deposits')
  async createDeposit(
    @User('id') userId: string,
    @IdempotencyKey(new ParseUUIDPipe()) idempotencyKey: string,
    @Body(ValidationPipe) { amount }: BalanceOperationDto,
  ) {
    return await this.balanceService.createDeposit(
      userId,
      amount,
      idempotencyKey,
    );
  }

  @Post('withdrawals')
  async createWithdrawal(
    @User('id') userId: string,
    @IdempotencyKey(new ParseUUIDPipe()) idempotencyKey: string,
    @Body(ValidationPipe) { amount }: BalanceOperationDto,
  ) {
    return await this.balanceService.createWithdrawal(
      userId,
      amount,
      idempotencyKey,
    );
  }

  @Get()
  async getBalance(@User('id') userId: string) {
    return await this.balanceService.getBalance(userId);
  }
}
