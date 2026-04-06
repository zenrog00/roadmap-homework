import { FileStorage } from 'src/file-storage/file-storage';
import { S3StorageOptions } from './s3-storage.options';

export type S3StorageCtorArgs = ConstructorParameters<typeof S3Storage>;

export class S3Storage extends FileStorage {
  constructor(private readonly options: S3StorageOptions) {
    super();
  }

  uploadFile() {
    throw new Error('Method not implemented.');
  }
  removeFile() {
    throw new Error('Method not implemented.');
  }
}
