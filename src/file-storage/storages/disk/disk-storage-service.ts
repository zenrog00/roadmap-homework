import { FileStorageService } from 'src/file-storage/file-storage.service';
import { Readable } from 'node:stream';

export class DiskStorage extends FileStorageService {
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
