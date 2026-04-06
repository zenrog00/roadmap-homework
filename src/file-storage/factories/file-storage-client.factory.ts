import { S3Client } from '@aws-sdk/client-s3';
import { FileStorageDriver } from '../interfaces/file-storage.options';

type FileStorageClientByDriverMap = {
  s3: S3Client;
  disk: never;
};

export type FileStorageClientByDriver<D extends FileStorageDriver> =
  // using FileStorageClientByDriverMap to get strong typing
  // about when to pass client to storage constructor
  FileStorageClientByDriverMap[D];
