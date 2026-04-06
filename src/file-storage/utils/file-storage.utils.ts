import { FileStorageDriver } from '../interfaces/file-storage.options';

export function getFileStorageToken(
  driver: FileStorageDriver,
  namespace?: string,
) {
  return `${driver.toUpperCase()}_FILE_STORAGE${namespace ? `_${namespace.toUpperCase()}` : ''}`;
}

export function getFileStorageClientToken(
  driver: FileStorageDriver,
  name?: string,
) {
  return `${driver.toUpperCase()}_FILE_STORAGE_CLIENT${name ? `_${name.toUpperCase()}` : ''}`;
}
