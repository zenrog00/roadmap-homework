import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class BalanceResetService {
  private readonly logger = new Logger(BalanceResetService.name);
  private readonly balanceResetJobName = 'reset-global';
  private readonly balanceResetJobIntervalMs = 10 * 60 * 1000; // 10 min

  constructor(@InjectQueue('balance') private readonly balanceQueue: Queue) {}

  async startBalanceResetJob() {
    try {
      await this.balanceQueue.upsertJobScheduler(this.balanceResetJobName, {
        every: this.balanceResetJobIntervalMs,
      });
      this.logger.log(
        `Created repeatable job for resetting users' balances with ${this.balanceResetJobIntervalMs}ms interval`,
      );
    } catch (err) {
      const errMessage = err instanceof Error ? err.message : String(err);
      const logMessage = `Failed to create repeatable job for resetting user's balances`;
      this.logger.warn(`${logMessage} \n${errMessage}`);
      throw new InternalServerErrorException(logMessage);
    }
  }
}
