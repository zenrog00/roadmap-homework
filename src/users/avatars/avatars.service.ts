import { Injectable } from '@nestjs/common';
import {
  FileStorageService,
  InjectFileStorageService,
  type UploadedFileDto,
} from 'src/file-storage';
import { AvatarsRepository } from './repositories';
import { UsersAvatarsRepository } from './repositories/users-avatars.repository';
import { Transactional } from 'typeorm-transactional';

@Injectable()
export class AvatarsService {
  constructor(
    @InjectFileStorageService('users-avatars')
    fileStorageService: FileStorageService,
    private readonly avatarsRepository: AvatarsRepository,
    private readonly usersAvatarsRepository: UsersAvatarsRepository,
  ) {}

  @Transactional()
  async saveAvatarData(
    userId: string,
    { key, size, mimetype }: UploadedFileDto,
  ) {
    const avatarId = key.split('/').at(-1);

    await this.avatarsRepository.save({
      id: avatarId,
      size,
      mimetype,
    });

    await this.usersAvatarsRepository.save({
      userId,
      avatarId,
    });
  }
}

// {
//   fieldname: 'file',
//   originalname: 'doll1.png',
//   encoding: '7bit',
//   mimetype: 'image/png',
//   bucket: 'users-avatars',
//   key: '019d67be-5fc5-704d-8752-fe30e049ced6/019d6d14-35fe-7648-93bc-750d981b0a75'
// }
