import { FileStorage } from 'src/file-storage/file-storage';
import { DiskStorageOptions } from './s3-storage.options';

export class DiskStorage extends FileStorage {
  constructor(private readonly options: DiskStorageOptions) {
    super();
  }

  uploadFile() {
    throw new Error('Method not implemented.');
  }

  removeFile() {
    throw new Error('Method not implemented.');
  }
}
