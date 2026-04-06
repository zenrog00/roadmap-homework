import { S3Client } from '@aws-sdk/client-s3';
import {
  FileStorageDriver,
  FileStorageOptionsByDriver,
} from '../interfaces/file-storage.options';

type FileStorageClientByDriverMap = {
  s3: S3Client;
  disk: never;
};

export type FileStorageClientByDriver<D extends FileStorageDriver> =
  // using FileStorageClientByDriverMap to get strong typing
  // about when to pass client to storage constructor
  FileStorageClientByDriverMap[D];

type FileStorageClientCreatorByDriver = {
  [D in FileStorageDriver]: (
    options: FileStorageOptionsByDriver<D>,
  ) => FileStorageClientByDriver<D>;
};

const FILE_STORAGE_CLIENT_CREATORS: FileStorageClientCreatorByDriver = {
  s3: (options) => new S3Client(options),
  disk: () => {
    throw new Error('Disk storage does not require a client');
  },
};

export function createFileStorageClient<D extends FileStorageDriver>(
  options: FileStorageOptionsByDriver<D>,
): FileStorageClientByDriver<D> {
  return FILE_STORAGE_CLIENT_CREATORS[options.driver](options);
}
