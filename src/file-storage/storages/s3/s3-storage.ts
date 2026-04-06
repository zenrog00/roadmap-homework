import { FileStorage } from 'src/file-storage/file-storage';
import { S3StorageOptions } from './s3-storage.options';
import { Readable } from 'node:stream';

export type S3StorageCtorArgs = ConstructorParameters<typeof S3Storage>;

export class S3Storage extends FileStorage {
  constructor(private readonly options: S3StorageOptions) {
    super();
  }

  getFile(): Promise<Readable> | Readable {
    throw new Error('Method not implemented.');
  }
  removeFile() {
    throw new Error('Method not implemented.');
  }
}
