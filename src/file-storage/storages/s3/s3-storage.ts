import { FileStorage } from 'src/file-storage/file-storage';
import { Readable } from 'node:stream';
import type { S3Client } from '@aws-sdk/client-s3';

export type S3StorageCtorArgs = ConstructorParameters<typeof S3Storage>;

export class S3Storage extends FileStorage {
  constructor(private readonly client: S3Client) {
    super();
  }

  getFile(): Promise<Readable> | Readable {
    throw new Error('Method not implemented.');
  }
  removeFile() {
    throw new Error('Method not implemented.');
  }
}
