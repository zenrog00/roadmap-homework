import { Readable } from 'node:stream';

export abstract class FileStorageService {
  constructor(protected readonly namespace: string) {}

  abstract getFile(key: string): Promise<Readable> | Readable;

  abstract getFileDownloadUrl(key: string): Promise<string> | string;

  abstract removeFile(key: string);
}
