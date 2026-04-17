import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { UsersModule } from 'src/users';
import { BalanceModule } from '../balance.module';
import { BalanceJobsQueueProcessor, BalanceResetController } from './index';
import { BalanceResetService } from './balance-reset.service';
import { BALANCE_JOBS_QUEUE_NAME } from './balance-jobs-queue.constants';

@Module({
  imports: [
    BullModule.registerQueue({ name: BALANCE_JOBS_QUEUE_NAME }),
    BalanceModule,
    UsersModule,
  ],
  controllers: [BalanceResetController],
  providers: [BalanceJobsQueueProcessor, BalanceResetService],
})
export class BalanceJobsQueueModule {}
