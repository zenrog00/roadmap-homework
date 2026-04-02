import { Readable } from 'node:stream';
import { UnsupportedMediaTypeException } from '@nestjs/common';
import { fileTypeFromStream } from 'file-type';

export interface FiletypeValidatorResult {
  uploadStream: Readable;
  filetype?: string;
}

export async function validateFiletypeFromStream(
  stream: Readable,
  filetypes?: readonly string[],
): Promise<FiletypeValidatorResult> {
  if (!filetypes?.length) {
    return { uploadStream: stream };
  }

  const webStream = Readable.toWeb(stream);
  const [typeDetectionStream, uploadStream] = webStream.tee();

  const fileType = await fileTypeFromStream(typeDetectionStream);

  if (!fileType) {
    throw new UnsupportedMediaTypeException(
      `Could not detect file type from file signature`,
    );
  }
  if (!filetypes.includes(fileType.mime)) {
    throw new UnsupportedMediaTypeException(
      `File type ${fileType?.ext || ''} not allowed`,
    );
  }

  return {
    uploadStream: Readable.fromWeb(uploadStream),
    filetype: fileType.mime,
  };
}
