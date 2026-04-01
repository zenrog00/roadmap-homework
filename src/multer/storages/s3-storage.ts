/* eslint-disable @typescript-eslint/no-unused-vars */
import { StorageEngine } from 'multer';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Request } from 'express';
import type {
  OptionCallback,
  KeysWithOptionCallback,
  ResolvedOption,
} from './types';

export interface S3StorageOptions {
  s3Client: S3Client;
  bucket: string | OptionCallback<string>;
  filename: OptionCallback<string>;
}

export type S3StorageFileInfo = Partial<Express.Multer.File> & {
  bucket: string;
  key: string;
};
export type UploadedS3File = Express.Multer.File & S3StorageFileInfo;

class S3StorageEngine implements StorageEngine {
  constructor(private readonly options: S3StorageOptions) {}

  _handleFile(
    req: Request,
    file: Express.Multer.File,
    cb: (error?: any, info?: Partial<Express.Multer.File>) => void,
  ): void {
    (async () => {
      const bucket = await this.resolveOption('bucket', req, file);
      const filename = await this.resolveOption('filename', req, file);

      const upload = new Upload({
        client: this.options.s3Client,
        params: {
          Bucket: bucket,
          Key: filename,
          Body: file.stream,
          ContentType: file.mimetype,
        },
      });

      await upload.done();

      const info: S3StorageFileInfo = {
        bucket,
        key: filename,
      };

      cb(null, info);
    })().catch(cb);
  }

  _removeFile(
    req: Request,
    file: Express.Multer.File,
    callback: (error: Error | null) => void,
  ): void {
    throw new Error('Method not implemented.');
  }

  private resolveOption<T extends KeysWithOptionCallback<S3StorageOptions>>(
    option: T,
    req: Request,
    file: Express.Multer.File,
  ): Promise<ResolvedOption<S3StorageOptions[T]>> {
    const optionValue = this.options[option];

    if (!optionValue || typeof optionValue !== 'function') {
      return Promise.resolve(
        optionValue as ResolvedOption<S3StorageOptions[T]>,
      );
    }

    return new Promise((resolve, reject) => {
      optionValue(req, file, (error, value) => {
        if (error) {
          return reject(error);
        }

        resolve(value as ResolvedOption<S3StorageOptions[T]>);
      });
    });
  }
}

// creating factory function to comply to multer code and naming conventions
export function s3Storage(options: S3StorageOptions): StorageEngine {
  return new S3StorageEngine(options);
}
