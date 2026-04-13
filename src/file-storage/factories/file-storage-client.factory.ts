import { S3Client } from '@aws-sdk/client-s3';
import {
  FileStorageDriver,
  FileStorageOptionsByDriver,
} from '../interfaces/file-storage.options';

type FileStorageClientByDriverMap = {
  s3: S3Client;
};

export type FileStorageClientByDriver<D extends FileStorageDriver> =
  // using FileStorageClientByDriverMap to get strong typing
  // about when to pass client to storage constructor
  FileStorageClientByDriverMap[D];

export type FileStorageClientOptionsByDriver<D extends FileStorageDriver> =
  Extract<FileStorageOptionsByDriver<D>, { client: any }> extends {
    client: infer C;
  }
    ? C
    : never;

type FileStorageClientCreatorByDriver = {
  [D in FileStorageDriver]: (
    options: FileStorageClientOptionsByDriver<D>,
  ) => FileStorageClientByDriver<D>;
};

const FILE_STORAGE_CLIENT_CREATORS: FileStorageClientCreatorByDriver = {
  s3: (options) => new S3Client(options),
};

export function createFileStorageClient<D extends FileStorageDriver>(
  driver: D,
  options: FileStorageClientOptionsByDriver<D>,
): FileStorageClientByDriver<D> {
  return FILE_STORAGE_CLIENT_CREATORS[driver](options);
}
