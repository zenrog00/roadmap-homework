import { FileStorageDriver } from '../interfaces/file-storage.options';
import { FileStorageService } from '../file-storage.service';
import { S3StorageService } from '../storages/s3/s3-storage.service';
import { DiskStorageService } from '../storages/disk/disk-storage-service';
import { FileStorageClientByDriver } from './file-storage-client.factory';

// strong typing for storage client argument based on driver
// (does storage require client in its constructor?)
export type FileStorageClientArg<D extends FileStorageDriver> =
  FileStorageClientByDriver<D> extends never
    ? []
    : [client: FileStorageClientByDriver<D>];

type FileStorageServiceCreatorByDriver = {
  [D in FileStorageDriver]: (
    ...clientArg: FileStorageClientArg<D>
  ) => FileStorageService;
};

const FILE_STORAGE_SERVICE_CREATORS: FileStorageServiceCreatorByDriver = {
  s3: (...clientArg) => new S3StorageService(...clientArg),
  disk: () => new DiskStorageService(), // placeholder for now
};

export function createFileStorageService<D extends FileStorageDriver>(
  driver: D,
  // clientArg is tuple because this provides
  // strict number of arguments based on FileStorageClientArg type
  ...clientArg: FileStorageClientArg<D>
): FileStorageService {
  return FILE_STORAGE_SERVICE_CREATORS[driver](...clientArg);
}
