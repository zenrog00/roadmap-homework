import {
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { BalanceRepository } from '../repositories';
import { UsersService } from 'src/users';
import {
  BALANCE_RESET_BATCH_SIZE,
  BALANCE_RESET_JOB_CRON_PATTERN,
  BALANCE_JOBS_QUEUE_NAME,
  BALANCE_RESET_JOB_NAME,
  BALANCE_RESET_SCHEDULER_ID,
} from './balance-jobs-queue.constants';
import { User } from 'src/users/entities';

@Injectable()
export class BalanceResetService implements OnModuleDestroy {
  private readonly logger = new Logger(BalanceResetService.name);

  constructor(
    private readonly balanceRepository: BalanceRepository,
    private readonly usersService: UsersService,
    @InjectQueue(BALANCE_JOBS_QUEUE_NAME)
    private readonly balanceQueue: Queue,
  ) {}

  async startBalanceResetJob() {
    try {
      await this.balanceQueue.upsertJobScheduler(
        BALANCE_RESET_SCHEDULER_ID,
        {
          pattern: BALANCE_RESET_JOB_CRON_PATTERN,
          immediately: true,
        },
        {
          name: BALANCE_RESET_JOB_NAME,
        },
      );
      this.logger.log(
        `Started scheduler "${BALANCE_RESET_SCHEDULER_ID}" for job "${BALANCE_RESET_JOB_NAME}" with cron pattern "${BALANCE_RESET_JOB_CRON_PATTERN}" (immediately=true)`,
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

  async onModuleDestroy() {
    this.logger.log(
      `Stopping users' balances reset scheduler ${BALANCE_RESET_SCHEDULER_ID} on module destroy`,
    );
    await this.stopBalanceResetJob();
  }

  async resetAllUsersBalances() {
    let batchesProcessed = 0;
    let usersScanned = 0;
    let totalAffectedUsersCount = 0;
    let errorsCount = 0;
    let cursor: string | undefined;

    while (true) {
      let users: User[];
      try {
        users = await this.usersService.findUserIdsBatch(
          BALANCE_RESET_BATCH_SIZE,
          cursor,
        );
      } catch (err) {
        ++errorsCount;
        const message = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          `Failed to fetch users' ids batch for balance reset: \n${message}`,
        );
        break;
      }

      if (!users.length) {
        break;
      }

      ++batchesProcessed;
      usersScanned += users.length;

      const userIds = users.map(({ id }) => id);

      try {
        const affectedUsersCount =
          await this.balanceRepository.resetBalancesByUserIds(userIds);
        totalAffectedUsersCount += affectedUsersCount;
      } catch (err) {
        ++errorsCount;
        const message = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          `Failed to reset balances for user id batch. firstUserId=${userIds[0]} lastUserId=${userIds.at(-1)} \n${message}`,
        );
      }

      cursor = users.at(-1)?.id;
      if (users.length < BALANCE_RESET_BATCH_SIZE) {
        break;
      }
    }

    this.logger.log(
      `Balance reset job completed
      batches processed: ${batchesProcessed}
      users scanned: ${usersScanned}
      affected users: ${totalAffectedUsersCount}
      errors: ${errorsCount}`,
    );
  }
}
