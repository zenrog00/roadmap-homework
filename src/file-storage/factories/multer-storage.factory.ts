import type { StorageEngine } from 'multer';
import type { FileStorageDriver } from '../interfaces/file-storage.options';
import { s3Storage } from '../storages/s3/multer/s3-multer-storage';
import type { S3MulterStorageOptions } from '../storages/s3/multer/s3-multer-storage.options';
import type { FileStorageClientByDriver } from './file-storage-client.factory';

type MulterStorageOptionsByDriverMap = {
  s3: Omit<S3MulterStorageOptions, 's3Client'>;
};

export type MulterStorageOptionsByDriver<D extends FileStorageDriver> =
  MulterStorageOptionsByDriverMap[D];

type MulterStorageDepByDriverMap = {
  s3: FileStorageClientByDriver<'s3'>;
};

type MulterStorageDepByDriver<D extends FileStorageDriver> =
  MulterStorageDepByDriverMap[D];

export type MulterStorageDepArg<D extends FileStorageDriver> =
  MulterStorageDepByDriver<D> extends never
    ? []
    : [dep: MulterStorageDepByDriver<D>];

type MulterStorageCreatorByDriver = {
  [D in FileStorageDriver]: (
    options: MulterStorageOptionsByDriver<D>,
    ...depArg: MulterStorageDepArg<D>
  ) => StorageEngine;
};

const MULTER_STORAGE_CREATORS: MulterStorageCreatorByDriver = {
  s3: (options, s3Client) => s3Storage({ ...options, s3Client }),
};

export function createMulterStorage<D extends FileStorageDriver>(
  driver: D,
  options: MulterStorageOptionsByDriver<D>,
  ...depArg: MulterStorageDepArg<D>
): StorageEngine {
  return MULTER_STORAGE_CREATORS[driver](options, ...depArg);
}
