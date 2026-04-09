import { Readable } from 'node:stream';

export abstract class FileStorageService {
  constructor(protected readonly namespace: string) {}

  abstract getFile(): Promise<Readable> | Readable;

  abstract removeFile();
}
