import { FileStorageDriver } from '../interfaces/file-storage.options';
import { FileStorageService } from '../file-storage.service';
import { S3StorageService } from '../storages/s3/s3-storage.service';
import { DiskStorage } from '../storages/disk/disk-storage-service';
import { FileStorageClientByDriver } from './file-storage-client.factory';

type FileStorageServiceCtorByDriver<D extends FileStorageDriver> = new (
  client?: FileStorageClientByDriver<D>,
) => FileStorageService;

type FileStorageServiceCtorsMapping = {
  [D in FileStorageDriver]: FileStorageServiceCtorByDriver<D>;
};

const FILE_STORAGE_SERVICE_CLASSES: FileStorageServiceCtorsMapping = {
  s3: S3StorageService,
  disk: DiskStorage, // placeholder for now
};

// strong typing for storage client argument based on driver
// (does storage require client in its constructor)
export type FileStorageClientArg<D extends FileStorageDriver> =
  FileStorageClientByDriver<D> extends never
    ? []
    : [client: FileStorageClientByDriver<D>];

export function createFileStorageService<D extends FileStorageDriver>(
  driver: D,
  // clientArg is tuple because this provides
  // strict number of arguments based on FileStorageClientArg type
  ...clientArg: FileStorageClientArg<D>
): FileStorageService {
  const FileStorageClass = FILE_STORAGE_SERVICE_CLASSES[driver];
  if (!FileStorageClass) {
    throw new Error(`File storage driver ${driver} not found`);
  }
  return new FileStorageClass(clientArg[0]);
}
