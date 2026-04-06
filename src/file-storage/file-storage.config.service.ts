import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  FileStorageOptionsFactory,
  FileStorageModuleOptions,
} from './interfaces/file-storage.options';
import { EnvironmentVariables } from 'src/env';

@Injectable()
export class FilesStorageConfigService implements FileStorageOptionsFactory {
  constructor(
    private readonly configService: ConfigService<EnvironmentVariables, true>,
  ) {}

  createFileStorageOptions(): FileStorageModuleOptions {
    const host = this.configService.get('MINIO_HOST', { infer: true });
    const port = this.configService.get('MINIO_PORT', { infer: true });
    const endpoint = `http://${host}:${port}`;

    return [
      {
        driver: 's3',
        client: {
          endpoint,
          region: 'ru-central1',
          credentials: {
            accessKeyId: this.configService.get('MINIO_ROOT_USER', {
              infer: true,
            }),
            secretAccessKey: this.configService.get('MINIO_ROOT_PASSWORD', {
              infer: true,
            }),
          },
        },
      },
    ];
  }
}
