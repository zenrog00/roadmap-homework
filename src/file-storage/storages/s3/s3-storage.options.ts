import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import type { S3ClientConfig } from '@aws-sdk/client-s3';
import type { FileStorageBaseOptions } from 'src/file-storage/interfaces/file-storage.options';

export type S3StorageClientOptions = S3ClientConfig;

export type FileStorageClientByDriverMap = {
  s3: S3StorageClientOptions;
  disk: undefined;
};

export type S3StorageOptions = FileStorageBaseOptions<
  's3',
  FileStorageClientByDriverMap['s3']
>;

export type S3StorageMulterOptions = Omit<
  MulterOptions,
  'storage' | 'fileFilter'
> & {
  bucket: string;
  filename: string;
  filetypes?: readonly string[];
};
