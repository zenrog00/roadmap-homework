import { Inject } from '@nestjs/common';
import {
  getFileStorageOptionsToken,
  getFileStorageServiceToken,
} from '../utils/file-storage.utils';
import { FILE_STORAGE_OPTIONS } from '../constants';

export const InjectFileStorageService = (
  namespace?: string,
): ReturnType<typeof Inject> => Inject(getFileStorageServiceToken(namespace));

export const InjectFileStorageGlobalOptions: ReturnType<typeof Inject> = () =>
  Inject(FILE_STORAGE_OPTIONS);

export const InjectFileStorageOptions = (
  namespace?: string,
): ReturnType<typeof Inject> => Inject(getFileStorageOptionsToken(namespace));
