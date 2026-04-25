import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  FileStorageService,
  InjectFileStorageService,
  type UploadedFileDto,
} from 'src/file-storage';
import { AvatarsRepository } from './repositories';
import { UsersAvatarsRepository } from './repositories/users-avatars.repository';
import { Transactional } from 'typeorm-transactional';
import { UsersService } from '../users.service';

@Injectable()
export class AvatarsService {
  private readonly logger = new Logger(AvatarsService.name);
  private readonly AVATAR_COUNT_LIMIT = 5;

  constructor(
    @InjectFileStorageService('users-avatars')
    private readonly fileStorageService: FileStorageService,
    private readonly avatarsRepository: AvatarsRepository,
    private readonly usersAvatarsRepository: UsersAvatarsRepository,
    private readonly usersService: UsersService,
  ) {}

  @Transactional()
  async saveAvatarData(
    userId: string,
    { key, size, mimetype }: UploadedFileDto,
  ) {
    const avatarId = key.split('/').at(-1);

    // preventing race condition when
    // user uploads avatars concurrently
    await this.usersService.lockUserForUpdate(userId);
    const userAvatarsCount =
      await this.usersAvatarsRepository.countUserAvatars(userId);
    if (userAvatarsCount >= this.AVATAR_COUNT_LIMIT) {
      this.logger.warn(
        `Avatar upload rejected: user ${userId} already has ${userAvatarsCount} avatars (limit ${this.AVATAR_COUNT_LIMIT})`,
      );
      throw new ForbiddenException(
        `You can't have more than ${this.AVATAR_COUNT_LIMIT} avatars!`,
      );
    }

    await this.avatarsRepository.save({
      id: avatarId,
      size,
      mimetype,
    });

    await this.usersAvatarsRepository.save({
      userId,
      avatarId,
    });

    this.logger.log(
      `Avatar saved for user ${userId}: avatarId=${avatarId} size=${size} mimetype=${mimetype}`,
    );

    return avatarId;
  }

  async getMyAvatarsList(userId: string) {
    return this.usersAvatarsRepository.findAll(userId);
  }

  async getMyAvatarDownloadUrl(userId: string, avatarId: string) {
    // checking that avatar was not soft deleted
    const userAvatarCount = await this.usersAvatarsRepository.countUserAvatars(
      userId,
      avatarId,
    );
    if (userAvatarCount < 1) {
      this.logger.warn(
        `Avatar download URL requested for missing avatar userId=${userId} avatarId=${avatarId}`,
      );
      throw new NotFoundException('Avatar was not found!');
    }

    const avatarKey = `${userId}/${avatarId}`;

    const url = await this.fileStorageService.getFileDownloadUrl(avatarKey);
    this.logger.log(
      `Issued avatar download URL for userId=${userId} avatarId=${avatarId}`,
    );
    return url;
  }

  async deleteMyAvatar(userId: string, avatarId: string) {
    await this.avatarsRepository.softDeleteUserAvatar(userId, avatarId);
    this.logger.log(
      `Avatar soft-deleted for userId=${userId} avatarId=${avatarId}`,
    );
  }
}
