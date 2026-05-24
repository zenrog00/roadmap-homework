import { StorageEngine } from 'multer';
import { Request } from 'express';

import type {
  OptionCallback,
  KeysWithOptionCallback,
  ResolvedOption,
  DefinedResolvedOption,
} from './types';

export abstract class MulterStorageTemplate<
  StorageOptions extends object,
> implements StorageEngine {
  constructor(protected readonly options: StorageOptions) {}

  abstract _handleFile(
    req: Request,
    file: Express.Multer.File,
    callback: (error?: any, info?: Partial<Express.Multer.File>) => void,
  ): void;

  abstract _removeFile(
    req: Request,
    file: Express.Multer.File,
    callback: (error: Error | null) => void,
  ): void;

  protected resolveOption<T extends KeysWithOptionCallback<StorageOptions>>(
    option: T,
    req: Request,
    file: Express.Multer.File,
  ): Promise<ResolvedOption<StorageOptions[T]>> {
    const optionValue = this.options[option];

    if (optionValue === undefined || typeof optionValue !== 'function') {
      return Promise.resolve(optionValue as ResolvedOption<StorageOptions[T]>);
    }

    // we need type assertion to narrow the type of the option value
    // to the OptionCallback type
    const callbackOption = optionValue as OptionCallback<
      DefinedResolvedOption<StorageOptions[T]>
    >;

    return new Promise((resolve, reject) => {
      callbackOption(req, file, (error, value) => {
        if (error) {
          return reject(error);
        }

        resolve(value as ResolvedOption<StorageOptions[T]>);
      });
    });
  }
}
