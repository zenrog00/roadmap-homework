import type { S3ClientConfig } from '@aws-sdk/client-s3';
import type { FileStorageBaseOptions } from 'src/file-storage/interfaces/file-storage.options';

export type S3StorageClientOptions = S3ClientConfig;

export type S3StorageOptions = FileStorageBaseOptions<
  's3',
  S3StorageClientOptions
>;
