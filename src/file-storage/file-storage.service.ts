import { Readable } from 'node:stream';

export interface FileStorageEntry {
  key: string;
  lastModified?: Date;
}

export abstract class FileStorageService {
  constructor(protected readonly namespace: string) {}

  abstract getFile(key: string): Promise<Readable> | Readable;

  abstract getFileDownloadUrl(key: string): Promise<string> | string;

  abstract getFileList(prefix?: string): Promise<FileStorageEntry[]>;

  abstract removeFile(key: string);
}
