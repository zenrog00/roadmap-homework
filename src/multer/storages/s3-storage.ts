/* eslint-disable @typescript-eslint/no-unused-vars */
import { StorageEngine } from 'multer';
import { S3Client } from '@aws-sdk/client-s3';
import { Request } from 'express';
import type {
  OptionCallback,
  KeysWithOptionCallback,
  ResolvedOption,
} from './types';

export interface S3StorageOptions {
  s3Client: S3Client;
  bucket: string | OptionCallback<string>;
  filename?: OptionCallback<string>;
}

class S3StorageEngine implements StorageEngine {
  constructor(private readonly options: S3StorageOptions) {}

  _handleFile(
    req: Request,
    file: Express.Multer.File,
    cb: (error?: any, info?: Partial<Express.Multer.File>) => void,
  ): void {
    throw new Error('Method not implemented.');
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
