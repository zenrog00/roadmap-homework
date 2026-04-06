export function getFileStorageToken(namespace?: string) {
  return `${namespace?.toUpperCase() || 'DEFAULT'}_FILE_STORAGE`;
}

export function getFileStorageClientToken(namespace?: string) {
  return `${namespace?.toUpperCase() || 'DEFAULT'}_FILE_STORAGE_CLIENT`;
}
