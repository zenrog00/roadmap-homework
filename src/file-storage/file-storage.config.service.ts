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
    return [
      {
        driver: 's3',
        host: this.configService.get('MINIO_HOST', { infer: true }),
        port: this.configService.get('MINIO_PORT', { infer: true }),
        rootUser: this.configService.get('MINIO_ROOT_USER', { infer: true }),
        rootPassword: this.configService.get('MINIO_ROOT_PASSWORD', {
          infer: true,
        }),
      },
    ];
  }
}
