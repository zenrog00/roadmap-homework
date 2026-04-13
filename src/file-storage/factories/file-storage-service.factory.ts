import { FileStorageDriver } from '../interfaces/file-storage.options';
import { FileStorageService } from '../file-storage.service';
import { S3StorageService } from '../storages/s3/s3-storage.service';
import { FileStorageClientByDriver } from './file-storage-client.factory';

type FileStorageServiceCtorArgByDriver = {
  s3: [namespace: string, client: FileStorageClientByDriver<'s3'>];
  disk: [namespace: string];
};

export type FileStorageServiceCtorArg<D extends FileStorageDriver> =
  FileStorageServiceCtorArgByDriver[D];

type FileStorageServiceCreatorByDriver = {
  [D in FileStorageDriver]: (
    ...ctorArg: FileStorageServiceCtorArg<D>
  ) => FileStorageService;
};

const FILE_STORAGE_SERVICE_CREATORS: FileStorageServiceCreatorByDriver = {
  s3: (namespace, client) => new S3StorageService(namespace, client),
};

export function createFileStorageService<D extends FileStorageDriver>(
  driver: D,
  // ctorArg is tuple because this provides
  // strict number of arguments based on FileStorageServiceCtorArg type
  ...ctorArg: FileStorageServiceCtorArg<D>
): FileStorageService {
  return FILE_STORAGE_SERVICE_CREATORS[driver](...ctorArg);
}
