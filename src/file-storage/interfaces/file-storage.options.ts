import { Type } from '@nestjs/common';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import type { S3StorageOptions } from '../storages/s3/s3-storage.options';
import { DiskStorageOptions } from '../storages/disk';
import type { MulterStorageOptionsByDriver } from '../factories/multer-storage.factory';

export type FileStorageBaseOptions<
  D extends FileStorageDriver,
  C = undefined,
> = C extends undefined
  ? { namespace?: string; driver: D }
  : { namespace?: string; driver: D; client: C };

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

export interface FileStorageMulterOptions<
  D extends FileStorageDriver = FileStorageDriver,
> {
  limits?: MulterOptions['limits'];
  storage: MulterStorageOptionsByDriver<D>;
}
