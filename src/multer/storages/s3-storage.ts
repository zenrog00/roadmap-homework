import { StorageEngine } from 'multer';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Request } from 'express';
import { StorageTemplate } from './storage-template';
import { validateFiletypeFromStream } from './utils/filetype-validator';

import type { OptionCallback } from './types';

export type AllowedFiletypes = readonly string[];

export interface S3StorageOptions {
  s3Client: S3Client;
  bucket: string | OptionCallback<string>;
  filename: string | OptionCallback<string>;
  filetypes?: AllowedFiletypes | OptionCallback<AllowedFiletypes>;
}

export type S3StorageFileInfo = Partial<Express.Multer.File> & {
  bucket: string;
  key: string;
};
export type UploadedS3File = Express.Multer.File & S3StorageFileInfo;

class S3StorageEngine extends StorageTemplate<S3StorageOptions> {
  constructor(options: S3StorageOptions) {
    super(options);
  }

  _handleFile(
    req: Request,
    file: Express.Multer.File,
    cb: (error?: any, info?: Partial<Express.Multer.File>) => void,
  ): void {
    (async () => {
      const bucket = await this.resolveOption('bucket', req, file);
      const filename = await this.resolveOption('filename', req, file);
      const filetypes = await this.resolveOption('filetypes', req, file);

      const { uploadStream } = await validateFiletypeFromStream(
        file.stream,
        filetypes,
      );

      const upload = new Upload({
        client: this.options.s3Client,
        params: {
          Bucket: bucket,
          Key: filename,
          Body: uploadStream,
          ContentType: file.mimetype,
        },
      });

      await upload.done();

      const info: S3StorageFileInfo = {
        bucket,
        key: filename,
      };

      console.log('Uploaded file to S3');
      cb(null, info);
    })().catch(cb);
  }

  _removeFile(
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null) => void,
  ): void {
    console.log('Removing file from S3');
    (async () => {
      const s3File = file as Express.Multer.File & Partial<S3StorageFileInfo>;

      if (!s3File.bucket || !s3File.key) {
        cb(null);
        return;
      }

      await this.options.s3Client.send(
        new DeleteObjectCommand({
          Bucket: s3File.bucket,
          Key: s3File.key,
        }),
      );

      cb(null);
    })().catch(cb);
  }
}

// creating factory function to comply to multer code and naming conventions
export function s3Storage(options: S3StorageOptions): StorageEngine {
  return new S3StorageEngine(options);
}
