// eslint-disable-next-line @typescript-eslint/no-unused-vars
const uploadedFileProperties = [
  'fieldname',
  'originalname',
  'encoding',
  'mimetype',
  'key',
] as const;

type UploadedFileProperties = (typeof uploadedFileProperties)[number];

export type UploadedFileDto = {
  [K in UploadedFileProperties]: K extends keyof Express.Multer.File
    ? Express.Multer.File[K]
    : string;
};

export type StorageFileInfo = Partial<Express.Multer.File> &
  Pick<UploadedFileDto, 'key'>;
