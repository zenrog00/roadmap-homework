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
  const webStream = Readable.toWeb(stream);
  const [typeDetectionStream, rawUploadStream] = filetypes?.length
    ? webStream.tee()
    : [undefined, webStream];

  let filetype: string | undefined;
  if (typeDetectionStream && filetypes?.length) {
    const fileType = await fileTypeFromStream(typeDetectionStream);

    if (!fileType) {
      throw new UnsupportedMediaTypeException(
        `Could not detect file type from file signature`,
      );
    }
    if (!filetypes.includes(fileType.mime)) {
      throw new UnsupportedMediaTypeException(
        `File type ${fileType.ext || ''} not allowed`,
      );
    }
    filetype = fileType.mime;
  }

  return {
    uploadStream: Readable.fromWeb(rawUploadStream),
    filetype,
  };
}
