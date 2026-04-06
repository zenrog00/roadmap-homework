import { FileStorage } from 'src/file-storage/file-storage';
import { DiskStorageOptions } from './s3-storage.options';
import { Readable } from 'node:stream';

export class DiskStorage extends FileStorage {
  constructor(private readonly options: DiskStorageOptions) {
    super();
  }

  getFile(): Promise<Readable> | Readable {
    throw new Error('Method not implemented.');
  }

  removeFile() {
    throw new Error('Method not implemented.');
  }
}
