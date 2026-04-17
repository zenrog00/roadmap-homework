import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { BalanceJobsQueueProcessor, BalanceResetController } from './index';
import { BalanceResetService } from './balance-reset.service';

@Module({
  imports: [BullModule.registerQueue({ name: 'balance' })],
  controllers: [BalanceResetController],
  providers: [BalanceJobsQueueProcessor, BalanceResetService],
})
export class BalanceJobsQueueModule {}
