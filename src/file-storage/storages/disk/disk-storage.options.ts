import { FileStorageBaseOptions } from 'src/file-storage/interfaces/file-storage.options';
import { FileStorageClientByDriverMap } from '../s3/s3-storage.options';

export type DiskStorageOptions = FileStorageBaseOptions<
  'disk',
  FileStorageClientByDriverMap['disk']
>;
