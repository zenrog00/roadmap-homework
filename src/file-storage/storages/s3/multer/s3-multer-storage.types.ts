export type AllowedFiletypes = readonly string[];

export type S3StorageFileInfo = Partial<Express.Multer.File> & {
  bucket: string;
  key: string;
};
export type UploadedS3File = Express.Multer.File & S3StorageFileInfo;
