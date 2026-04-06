import { Readable } from 'node:stream';

export abstract class FileStorage {
  abstract getFile(): Promise<Readable> | Readable;

  abstract removeFile();
}
