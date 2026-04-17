import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { BalanceJobsQueueProcessor, BalanceResetController } from './index';
import { BalanceResetService } from './balance-reset.service';
import { BALANCE_JOBS_QUEUE_NAME } from './balance-jobs-queue.constants';

@Module({
  imports: [BullModule.registerQueue({ name: BALANCE_JOBS_QUEUE_NAME })],
  controllers: [BalanceResetController],
  providers: [BalanceJobsQueueProcessor, BalanceResetService],
})
export class BalanceJobsQueueModule {}
