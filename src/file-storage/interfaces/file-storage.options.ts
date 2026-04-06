import { Type } from '@nestjs/common';
import {
  S3StorageOptions,
  DiskStorageOptions,
} from '../storages/s3/s3-storage.options';

export type FileStorageOptions = S3StorageOptions | DiskStorageOptions;

// type is array for possible storage extensions
export type FileStorageModuleOptions = FileStorageOptions[];

export type FileStorageDriver = FileStorageModuleOptions[number]['driver'];

export type FileStorageOptionsByDriver<D extends FileStorageDriver> = Extract<
  FileStorageOptions,
  { driver: D }
>;

export interface FileStorageOptionsFactory {
  createFileStorageOptions():
    | Promise<FileStorageModuleOptions>
    | FileStorageModuleOptions;
}

export interface FileStorageAsyncOptions {
  useClass: Type<FileStorageOptionsFactory>;
  // TODO
  // add other properties of ConfigurableModuleBuilder
}
