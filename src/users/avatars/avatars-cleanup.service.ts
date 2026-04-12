import { Injectable, Logger } from '@nestjs/common';
import { FileStorageService, InjectFileStorageService } from 'src/file-storage';
import { AvatarsRepository } from './repositories';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class AvatarsCleanupService {
  private readonly logger = new Logger(AvatarsCleanupService.name);
  private readonly untilDays = 7;
  private readonly batchSize = 100;

  constructor(
    @InjectFileStorageService('users-avatars')
    private readonly fileStorageService: FileStorageService,
    private readonly avatarsRepository: AvatarsRepository,
  ) {}

  // every day at midnight Moscow
  @Cron('0 0 * * *')
  private async deleteSoftDeletedAvatars() {
    let totalProcessed = 0;
    let storageDeleted = 0;
    let databaseDeleted = 0;
    let errorsCount = 0;

    while (true) {
      const candidates = await this.avatarsRepository.findSoftDeleted(
        this.untilDays,
        this.batchSize,
      );

      if (!candidates.length) {
        break;
      }

      let deletedInBatch = 0;

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

        try {
          await this.avatarsRepository.delete({ id: avatarId });
          ++databaseDeleted;
          ++deletedInBatch;
        } catch (err) {
          ++errorsCount;

          const message = err instanceof Error ? err.message : String(err);
          this.logger.warn(
            `Failed to delete avatar ${avatarId} from database\n${message}`,
          );
        }

        // Prevent infinite loop if every item in batch failed
        if (candidates.length === this.batchSize && deletedInBatch === 0) {
          this.logger.warn(
            'Stopping avatars hard delete job because full batch failed to be deleted',
          );
          break;
        }

        if (candidates.length < this.batchSize) {
          break;
        }
      }

      this.logger.log(`Avatars hard delete job finished
        processed: ${totalProcessed}
        deleted from storage: ${storageDeleted}
        deleted from database: ${databaseDeleted}
        errors: ${errorsCount}`);
    }
  }
}
