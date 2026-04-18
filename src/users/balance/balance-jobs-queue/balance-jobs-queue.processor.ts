import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { BALANCE_JOBS_QUEUE_NAME } from './balance-jobs-queue.constants';
import { BalanceResetService } from './balance-reset.service';
import { BALANCE_RESET_JOB_NAME } from './balance-jobs-queue.constants';

@Processor(BALANCE_JOBS_QUEUE_NAME)
export class BalanceJobsQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(BalanceJobsQueueProcessor.name);

  constructor(private readonly balanceResetService: BalanceResetService) {
    super();
  }

  async process(job: Job) {
    if (job.name !== BALANCE_RESET_JOB_NAME) {
      this.logger.warn(`Skipped unsupported balance queue job: ${job.name}`);
      return;
    }

    this.logger.log(`Balance queue job started id=${job.id} name=${job.name}`);
    await this.balanceResetService.resetAllUsersBalances();
    this.logger.log(`Balance queue job finished id=${job.id} name=${job.name}`);
  }
}
