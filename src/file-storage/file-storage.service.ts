import { Readable } from 'node:stream';

export abstract class FileStorageService {
  abstract getFile(): Promise<Readable> | Readable;

  abstract removeFile();
}
