import { Readable, Transform } from 'node:stream';
import { UnsupportedMediaTypeException } from '@nestjs/common';
import { fileTypeFromStream } from 'file-type';

export interface FiletypeValidatorResult {
  uploadStream: Readable;
  getSize: () => number;
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

  let size = 0;
  const uploadStream = Readable.fromWeb(rawUploadStream);
  const sizeCountStream = new Transform({
    transform(chunk, _encoding, cb) {
      size += Buffer.isBuffer(chunk)
        ? chunk.length
        : Buffer.byteLength(String(chunk));
      cb(null, chunk);
    },
  });

  return {
    uploadStream: uploadStream.pipe(sizeCountStream),
    filetype,
    // returning closure function
    // because upload stream needs to be consumed
    // by storage first
    getSize: () => size,
  };
}
