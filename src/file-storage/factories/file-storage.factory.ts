import { FileStorageDriver } from '../interfaces/file-storage.options';
import { FileStorage } from '../file-storage';
import { S3Storage } from '../storages/s3/s3-storage';
import { DiskStorage } from '../storages/s3/disk-storage';
import { FileStorageClientByDriver } from './file-storage-client.factory';

type FileStorageCtorByDriver<D extends FileStorageDriver> = new (
  client?: FileStorageClientByDriver<D>,
) => FileStorage;

type FileStorageCtorsMapping = {
  [D in FileStorageDriver]: FileStorageCtorByDriver<D>;
};

const FILE_STORAGE_CLASSES: FileStorageCtorsMapping = {
  s3: S3Storage,
  disk: DiskStorage, // placeholder for now
};

// strong typing for storage client argument based on driver
// (does storage require client in its constructor)
export type FileStorageClientArg<D extends FileStorageDriver> =
  FileStorageClientByDriver<D> extends never
    ? []
    : [client: FileStorageClientByDriver<D>];

export function createFileStorage<D extends FileStorageDriver>(
  driver: D,
  // clientArg is tuple because this provides
  // strict number of arguments based on FileStorageClientArg type
  ...clientArg: FileStorageClientArg<D>
): FileStorage {
  const FileStorageClass = FILE_STORAGE_CLASSES[driver];
  if (!FileStorageClass) {
    throw new Error(`File storage driver ${driver} not found`);
  }
  return new FileStorageClass(clientArg[0]);
}
