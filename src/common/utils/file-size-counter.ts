import { Readable, Transform } from 'node:stream';

export interface FileSizeCounterResult {
  uploadStream: Readable;
  sizePromise: Promise<number>;
}

export function attachFileSizeCounter(stream: Readable): FileSizeCounterResult {
  let size = 0;

  const sizeCountStream = new Transform({
    transform(chunk, _encoding, cb) {
      size += Buffer.isBuffer(chunk)
        ? chunk.length
        : Buffer.byteLength(String(chunk));
      cb(null, chunk);
    },
  });

  const uploadStream = stream.pipe(sizeCountStream);
  const sizePromise = new Promise<number>((resolve, reject) => {
    uploadStream.once('end', () => resolve(size));
    uploadStream.once('error', reject);
    sizeCountStream.once('error', reject);
  });

  return {
    uploadStream,
    sizePromise,
  };
}
