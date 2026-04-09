import {
  DynamicModule,
  ForwardReference,
  InjectionToken,
  Type,
} from '@nestjs/common';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import type { S3StorageOptions } from '../storages/s3/s3-storage.options';
import { DiskStorageOptions } from '../storages/disk';
import type { MulterStorageOptionsByDriver } from '../factories/multer-storage.factory';

/**
 * - `namespace` is a logical storage area (defaults to `default` when omitted).
 * - If `C` is provided, `client` becomes required.
 */
export interface FileStorageBaseFields<D extends FileStorageDriver> {
  /**
   * Logical storage path.
   *
   * When omitted, the namespace resolves to default.
   * Driver implementations decide how this maps to physical storage.
   * - S3/MinIO storages should set namespace to bucket name.
   */
  namespace?: string;
  driver: D;
}

/**
 * Base storage options per namespace.
 *
 * If `C` is provided, `client` becomes required.
 */
export type FileStorageBaseOptions<
  D extends FileStorageDriver,
  C = undefined,
> = C extends undefined
  ? FileStorageBaseFields<D>
  : FileStorageBaseFields<D> & { client: C };

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

export interface FileStorageMulterAsyncOptions<
  D extends FileStorageDriver = FileStorageDriver,
> {
  imports?: (Type | DynamicModule | ForwardReference)[];
  inject?: InjectionToken[];
  useFactory: (
    ...args: unknown[]
  ) => FileStorageMulterOptions<D> | Promise<FileStorageMulterOptions<D>>;
}
