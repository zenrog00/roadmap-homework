import { Module } from '@nestjs/common';
import { AvatarsController } from './avatars.controller';
import { AvatarsService } from './avatars.service';
import { FileStorageModule } from 'src/file-storage';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from 'src/env';
import { v7 as uuidv7 } from 'uuid';

@Module({
  imports: [
    FileStorageModule.forFeature('users-avatars', 's3', {
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvironmentVariables, true>) => ({
        limits: { fileSize: 10 * 1024 * 1024 },
        storage: {
          bucket: config.get('MINIO_USERS_AVATARS_BUCKET', { infer: true }),
          filename: uuidv7(),
        },
      }),
    }),
  ],
  controllers: [AvatarsController],
  providers: [AvatarsService],
})
export class AvatarsModule {}
