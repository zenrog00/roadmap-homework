import { Injectable, Logger } from '@nestjs/common';
import { FileStorageService, InjectFileStorageService } from 'src/file-storage';
import { AvatarsRepository } from './repositories';
import { UsersService } from '../users.service';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class AvatarsCleanupService {
  private readonly logger = new Logger(AvatarsCleanupService.name);
  private readonly untilDays = 7;
  private readonly batchSize = 100;
  private readonly minOrphanAgeMs = 6 * 60 * 60 * 1000; // 6 hours

  constructor(
    @InjectFileStorageService('users-avatars')
    private readonly fileStorageService: FileStorageService,
    private readonly avatarsRepository: AvatarsRepository,
    private readonly usersService: UsersService,
  ) {}

  // every day at midnight Moscow
  @Cron('0 0 * * *', { timeZone: 'Europe/Moscow' })
  private async deleteSoftDeletedAvatars() {
    let totalProcessed = 0;
    let storageDeleted = 0;
    const databaseDeleted = 0;
    let errorsCount = 0;

    while (true) {
      const candidates = await this.avatarsRepository.findSoftDeleted(
        this.untilDays,
        this.batchSize,
      );

      if (!candidates.length) {
        break;
      }

      const deletedInBatch = 0;

      for (const { userId, avatarId } of candidates) {
        ++totalProcessed;
        const key = `${userId}/${avatarId}`;

        try {
          await this.fileStorageService.removeFile(key);
          ++storageDeleted;
        } catch (err) {
          ++errorsCount;

          const message = err instanceof Error ? err.message : String(err);
          this.logger.warn(
            `Failed to delete avatar ${key} from storage\n${message}`,
          );
        }

        const deleted = await this.tryDeleteStorageFile(key);
        if (deleted) {
          ++storageDeleted;
        } else {
          ++errorsCount;
        }
      }

      // Prevent infinite loop if every item in full batch failed.
      if (candidates.length === this.batchSize && deletedInBatch === 0) {
        this.logger.warn(
          'Stopping avatars hard delete job because full batch failed to be deleted',
        );
        break;
      }

      if (candidates.length < this.batchSize) {
        break;
      }

      this.logger.log(`Avatars hard delete job finished
        processed: ${totalProcessed}
        deleted from storage: ${storageDeleted}
        deleted from database: ${databaseDeleted}
        errors: ${errorsCount}`);
    }
  }

  // every sunday at 03:00 Moscow
  @Cron('0 3 * * 0', { timeZone: 'Europe/Moscow' })
  private async deleteOrphanStorageAvatars() {
    let scanned = 0;
    let orphanDeleted = 0;
    let skippedRecent = 0;
    let errorsCount = 0;
    let cursor: string | undefined;

    while (true) {
      const users = await this.usersService.findUserIdsBatch(
        this.batchSize,
        cursor,
      );

      for (const user of users) {
        const files = await this.fileStorageService.getFileList(user.id);

        for (const { key, lastModified } of files) {
          ++scanned;
          const avatarId = this.parseAvatarId(key, user.id);
          if (!avatarId) {
            continue;
          }

          if (this.isTooRecent(lastModified)) {
            ++skippedRecent;
            continue;
          }

          const exists = await this.avatarsRepository.existsActiveAvatar(
            user.id,
            avatarId,
          );
          if (exists) {
            continue;
          }

          const deleted = await this.tryDeleteStorageFile(key);
          if (deleted) {
            ++orphanDeleted;
          } else {
            ++errorsCount;
          }
        }
      }

      cursor = users.at(-1)?.id;

      if (users.length < this.batchSize) {
        break;
      }
    }

    this.logger.log(
      `Avatars orphan cleanup job finished
      scanned: ${scanned}
      deleted: ${orphanDeleted}
      skipped recent: ${skippedRecent}
      errors: ${errorsCount}`,
    );
  }

  private isTooRecent(lastModified?: Date) {
    if (!lastModified) {
      return false;
    }
    return Date.now() - lastModified.getTime() < this.minOrphanAgeMs;
  }

  private parseAvatarId(key: string, userId: string) {
    const prefix = `${userId}/`;
    if (!key.startsWith(prefix)) {
      return null;
    }
    const avatarId = key.slice(prefix.length);
    if (!avatarId || avatarId.includes('/')) {
      return null;
    }
    return avatarId;
  }

  private async tryDeleteStorageFile(key: string) {
    try {
      await this.fileStorageService.removeFile(key);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `Failed to delete file "${key}" from storage: \n${message}`,
      );
      return false;
    }
  }
}
