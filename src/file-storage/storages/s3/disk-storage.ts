import { FileStorage } from 'src/file-storage/file-storage';
import { Readable } from 'node:stream';

export class DiskStorage extends FileStorage {
  constructor() {
    super();
  }

  getFile(): Promise<Readable> | Readable {
    throw new Error('Method not implemented.');
  }

  removeFile() {
    throw new Error('Method not implemented.');
  }
}
