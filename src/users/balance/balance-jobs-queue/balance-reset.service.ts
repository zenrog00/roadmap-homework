import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  BALANCE_JOBS_QUEUE_NAME,
  BALANCE_RESET_JOB_INTERVAL_MS,
  BALANCE_RESET_JOB_NAME,
  BALANCE_RESET_SCHEDULER_ID,
} from './balance-jobs-queue.constants';

@Injectable()
export class BalanceResetService {
  private readonly logger = new Logger(BalanceResetService.name);

  constructor(
    @InjectQueue(BALANCE_JOBS_QUEUE_NAME)
    private readonly balanceQueue: Queue,
  ) {}

  async startBalanceResetJob() {
    try {
      await this.balanceQueue.upsertJobScheduler(
        BALANCE_RESET_SCHEDULER_ID,
        {
          every: BALANCE_RESET_JOB_INTERVAL_MS,
        },
        {
          name: BALANCE_RESET_JOB_NAME,
        },
      );
      this.logger.log(
        `Started scheduler "${BALANCE_RESET_SCHEDULER_ID}" for job "${BALANCE_RESET_JOB_NAME}" with ${BALANCE_RESET_JOB_INTERVAL_MS}ms interval`,
      );
    } catch (err) {
      const errMessage = err instanceof Error ? err.message : String(err);
      const logMessage = `Failed to start repeatable job for resetting user's balances`;
      this.logger.warn(`${logMessage} \n${errMessage}`);
      throw new InternalServerErrorException(logMessage);
    }
  }

  async stopBalanceResetJob() {
    try {
      const wasRemoved = await this.balanceQueue.removeJobScheduler(
        BALANCE_RESET_SCHEDULER_ID,
      );
      if (wasRemoved) {
        this.logger.log(
          `Stopped users' balances reset scheduler: ${BALANCE_RESET_SCHEDULER_ID}`,
        );
      } else {
        this.logger.warn(
          `Users' balances reset scheduler was not found: ${BALANCE_RESET_SCHEDULER_ID}`,
        );
      }
    } catch (err) {
      const errMessage = err instanceof Error ? err.message : String(err);
      const logMessage = `Failed to stop repeatable job for resetting user's balances`;
      this.logger.warn(`${logMessage} \n${errMessage}`);
      throw new InternalServerErrorException(logMessage);
    }
  }
}
