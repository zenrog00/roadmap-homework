import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

export interface S3StorageOptions {
  // optional name for differentianting storages
  // when multiple storages are used with the same driver
  namespace?: string;
  driver: 's3';
  host: string;
  port: number;
  rootUser: string;
  rootPassword: string;
}

export type S3StorageMulterOptions = Omit<
  MulterOptions,
  'storage' | 'fileFilter'
> & {
  bucket: string;
  filename: string;
  filetypes?: readonly string[];
};

export interface DiskStorageOptions {
  namespace?: string;
  driver: 'disk';
  host: string;
  port: number;
  rootUser: string;
  rootPassword: string;
  multerOptions?: S3StorageMulterOptions;
}
