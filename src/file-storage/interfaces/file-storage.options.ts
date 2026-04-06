import { Type } from '@nestjs/common';
import type { S3StorageOptions } from '../storages/s3/s3-storage.options';
import { DiskStorageOptions } from '../storages/disk';

export interface FileStorageBaseOptions<D extends FileStorageDriver, C> {
  namespace?: string;
  driver: D;
  client: C;
}

export type FileStorageOptions = S3StorageOptions | DiskStorageOptions;

// type is array for possible storage extensions
export type FileStorageModuleOptions = FileStorageOptions[];

export type FileStorageDriver = 's3' | 'disk';

export type FileStorageOptionsByDriver<D extends FileStorageDriver> = Extract<
  FileStorageOptions,
  { driver: D }
>;

export interface FileStorageOptionsFactory {
  createFileStorageOptions(): FileStorageModuleOptions;
}

export interface FileStorageAsyncOptions {
  useClass: Type<FileStorageOptionsFactory>;
  // TODO
  // add other properties of ConfigurableModuleBuilder
}
