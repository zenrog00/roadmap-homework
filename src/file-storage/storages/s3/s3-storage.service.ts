import { Logger } from '@nestjs/common';
import { FileStorageService } from 'src/file-storage/file-storage.service';
import { Readable } from 'node:stream';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  type S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export type S3StorageCtorArgs = ConstructorParameters<typeof S3StorageService>;

export class S3StorageService extends FileStorageService {
  private readonly logger = new Logger(S3StorageService.name);
  private readonly bucket: string;
  private readonly downloadUrlExpiresIn = 300; // seconds (5 min)

  constructor(
    namespace: string,
    private readonly client: S3Client,
  ) {
    super(namespace);
    this.bucket = namespace;
  }

  getFile(key: string): Promise<Readable> | Readable {
    this.logger.error(
      `getFile is not implemented (bucket=${this.bucket}, key=${key})`,
    );
    throw new Error(`${this.constructor.name}: Method not implemented`);
  }

  async getFileList(prefix?: string) {
    let continuationToken: string | undefined;
    const files: { key: string; lastModified?: Date }[] = [];

    try {
      do {
        const command = new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: prefix ? `${prefix}/` : undefined,
          ContinuationToken: continuationToken,
          MaxKeys: 1000,
        });

        const res = await this.client.send(command);
        for (const { Key, LastModified } of res.Contents ?? []) {
          if (Key) {
            files.push({ key: Key, lastModified: LastModified });
          }
        }

        continuationToken = res.IsTruncated
          ? res.NextContinuationToken
          : undefined;
      } while (continuationToken);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `ListObjectsV2 failed for bucket="${this.bucket}" prefix="${prefix ?? ''}": ${message}`,
        err instanceof Error ? err.stack : undefined,
      );
      throw err;
    }

    return files;
  }

  async getFileDownloadUrl(key: string): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const url = await getSignedUrl(this.client, command, {
        expiresIn: this.downloadUrlExpiresIn,
      });

      return url;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Presigned GetObject URL failed for bucket="${this.bucket}" key="${key}": ${message}`,
        err instanceof Error ? err.stack : undefined,
      );
      throw err;
    }
  }

  async removeFile(key: string) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      const result = await this.client.send(command);
      this.logger.log(`Deleted object bucket="${this.bucket}" key="${key}"`);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `DeleteObject failed for bucket="${this.bucket}" key="${key}": ${message}`,
        err instanceof Error ? err.stack : undefined,
      );
      throw err;
    }
  }
}
