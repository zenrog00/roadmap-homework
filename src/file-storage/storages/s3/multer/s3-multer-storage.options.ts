import { S3Client } from '@aws-sdk/client-s3';
import { OptionCallback } from '../../multer-utils/types';
import { AllowedFiletypes } from './s3-multer-storage.types';

export interface S3MulterStorageOptions {
  s3Client: S3Client;
  bucket: string | OptionCallback<string>;
  filename: string | OptionCallback<string>;
  filetypes?: AllowedFiletypes | OptionCallback<AllowedFiletypes>;
}
