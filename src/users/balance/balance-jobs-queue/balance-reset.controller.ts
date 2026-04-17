import { Controller, Post } from '@nestjs/common';
import { BalanceResetService } from './balance-reset.service';

@Controller('balance/reset-job')
export class BalanceResetController {
  constructor(private readonly balanceResetService: BalanceResetService) {}

  @Post('start')
  async startBalanceResetJob() {
    await this.balanceResetService.startBalanceResetJob();
  }

  @Post('stop')
  async stopBalanceResetJob() {
    await this.balanceResetService.stopBalanceResetJob();
  }
}
