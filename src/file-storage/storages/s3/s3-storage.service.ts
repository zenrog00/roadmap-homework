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
  private readonly bucket: string;
  private readonly downloadUrlExpiresIn = 300; // seconds (5 min)

  constructor(
    namespace: string,
    private readonly client: S3Client,
  ) {
    super(namespace);
    this.bucket = namespace;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getFile(key: string): Promise<Readable> | Readable {
    throw new Error(`${this.constructor.name}: Method not implemented`);
  }

  async getFileList(prefix?: string) {
    let continuationToken: string | undefined;
    const files: { key: string; lastModified?: Date }[] = [];

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

    return files;
  }

  async getFileDownloadUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    const url = await getSignedUrl(this.client, command, {
      expiresIn: this.downloadUrlExpiresIn,
    });

    return url;
  }

  async removeFile(key: string) {
    //throw new Error(`${this.constructor.name}: Method not implemented`);
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    return await this.client.send(command);
  }
}
