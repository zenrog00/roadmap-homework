import { StorageEngine } from 'multer';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Request } from 'express';
import { MulterStorageTemplate } from '../../multer-utils/multer-storage-template';
import { validateFiletypeFromStream } from '../../../../common/utils/filetype-validator';

import type { S3StorageFileInfo } from './s3-multer-storage.types';
import { S3MulterStorageOptions } from './s3-multer-storage.options';

class S3StorageEngine extends MulterStorageTemplate<S3MulterStorageOptions> {
  constructor(options: S3MulterStorageOptions) {
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
export function s3Storage(options: S3MulterStorageOptions): StorageEngine {
  return new S3StorageEngine(options);
}
