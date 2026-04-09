/* eslint-disable @typescript-eslint/no-unused-vars */
import { FileStorageService } from 'src/file-storage/file-storage.service';
import { Readable } from 'node:stream';

export class DiskStorageService extends FileStorageService {
  constructor(namespace: string) {
    super(namespace);
  }

  getFile(key: string): Promise<Readable> | Readable {
    throw new Error(`${this.constructor.name}: Method not implemented`);
  }

  getFileDownloadUrl(key: string): Promise<string> | string {
    throw new Error(`${this.constructor.name}: Method not implemented`);
  }

  removeFile(key: string) {
    throw new Error(`${this.constructor.name}: Method not implemented`);
  }
}
