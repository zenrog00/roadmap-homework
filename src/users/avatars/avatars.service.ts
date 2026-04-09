import { ForbiddenException, Injectable } from '@nestjs/common';
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
  private readonly AVATAR_COUNT_LIMIT = 5;

  constructor(
    @InjectFileStorageService('users-avatars')
    fileStorageService: FileStorageService,
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

    return avatarId;
  }

  async getMyAvatarsList(userId: string) {
    return this.usersAvatarsRepository.findAll(userId);
  }
}
