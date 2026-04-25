import { Logger } from '@nestjs/common';
import { StorageEngine } from 'multer';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Request } from 'express';
import { MulterStorageTemplate } from '../../multer-utils/multer-storage-template';
import { validateFiletypeFromStream } from 'src/common/utils/files';
import { attachFileSizeCounter } from 'src/common/utils/files';
import { StorageFileInfo } from '../../multer-utils';
import { S3MulterStorageOptions } from './s3-multer-storage.options';

class S3StorageEngine extends MulterStorageTemplate<S3MulterStorageOptions> {
  private readonly logger = new Logger('S3MulterStorage');

  constructor(options: S3MulterStorageOptions) {
    super(options);
  }

  _handleFile(
    req: Request,
    file: Express.Multer.File,
    cb: (error?: any, info?: Partial<Express.Multer.File>) => void,
  ): void {
    (async () => {
      const [bucket, filename, filetypes] = await Promise.all([
        this.resolveOption('bucket', req, file),
        this.resolveOption('filename', req, file),
        this.resolveOption('filetypes', req, file),
      ]);

      const { uploadStream: validatedUploadStream } =
        await validateFiletypeFromStream(file.stream, filetypes);
      const { uploadStream, sizePromise } = attachFileSizeCounter(
        validatedUploadStream,
      );

      const upload = new Upload({
        client: this.options.s3Client,
        params: {
          Bucket: bucket,
          Key: filename,
          Body: uploadStream,
          ContentType: file.mimetype,
        },
      });

      await upload.done();
      const size = await sizePromise;

      const info: StorageFileInfo = {
        size,
        key: `${bucket}/${filename}`,
      };

      this.logger.log(
        `Uploaded object to S3 bucket="${bucket}" key="${filename}" size=${size} bytes`,
      );
      cb(null, info);
    })().catch((err) => {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `S3 multipart upload failed: ${message}`,
        err instanceof Error ? err.stack : undefined,
      );
      cb(err);
    });
  }

  _removeFile(
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null) => void,
  ): void {
    (async () => {
      const { key } = file as StorageFileInfo;

      const firstSlashIdx = key.indexOf('/');
      const bucket = firstSlashIdx === -1 ? '' : key.slice(0, firstSlashIdx);
      const fileKey = firstSlashIdx === -1 ? '' : key.slice(firstSlashIdx + 1);

      if (!bucket || !fileKey) {
        this.logger.warn(
          `S3 remove skipped: invalid key format (expected "bucket/key", got "${key}")`,
        );
        cb(null);
        return;
      }

      await this.options.s3Client.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: fileKey,
        }),
      );

      this.logger.log(
        `Deleted object from S3 bucket="${bucket}" key="${fileKey}"`,
      );
      cb(null);
    })().catch((err) => {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `S3 delete object failed: ${message}`,
        err instanceof Error ? err.stack : undefined,
      );
      cb(err as Error);
    });
  }
}

// creating factory function to comply to multer code and naming conventions
export function s3Storage(options: S3MulterStorageOptions): StorageEngine {
  return new S3StorageEngine(options);
}
