export function getFileStorageServiceToken(namespace?: string) {
  return `${namespace?.toUpperCase() || 'DEFAULT'}_FILE_STORAGE`;
}

export function getFileStorageClientToken(namespace?: string) {
  return `${namespace?.toUpperCase() || 'DEFAULT'}_FILE_STORAGE_CLIENT`;
}

export function getFileStorageOptionsToken(namespace?: string) {
  return `${namespace?.toUpperCase() || 'DEFAULT'}_FILE_STORAGE_OPTIONS`;
}
