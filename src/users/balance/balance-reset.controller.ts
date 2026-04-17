import { Controller, Post } from '@nestjs/common';
import { BalanceService } from './balance.service';

@Controller('balance/reset-job')
export class BalanceResetController {
  constructor(private readonly balanceService: BalanceService) {}

  @Post('start')
  async startBalanceResetJob() {
    await this.balanceService.startBalanceResetJob();
  }
}
