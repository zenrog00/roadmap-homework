import { Module, DynamicModule } from '@nestjs/common';
import {
  FileStorageAsyncOptions,
  FileStorageDriver,
  FileStorageMulterOptions,
  FileStorageOptions,
} from './interfaces/file-storage.options';
import { FileStorageCoreModule } from './file-storage-core.module';
import {
  getFileStorageClientToken,
  getFileStorageOptionsToken,
} from './utils/file-storage.utils';
import { MulterModule } from '@nestjs/platform-express';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import {
  createMulterStorage,
  MulterStorageDepArg,
} from './factories/multer-storage.factory';
import { FileStorageClientByDriver } from './factories/file-storage-client.factory';

@Module({})
export class FileStorageModule {
  static forRootAsync(options: FileStorageAsyncOptions): DynamicModule {
    return {
      module: FileStorageModule,
      imports: [FileStorageCoreModule.forRootAsync(options)],
    };
  }

  static forFeature(
    namespace: string = 'default',
    multerOptions?: FileStorageMulterOptions,
  ): DynamicModule {
    const imports: DynamicModule[] = [
      FileStorageCoreModule.forFeature(namespace),
    ];

    if (multerOptions) {
      imports.push(
        MulterModule.registerAsync({
          imports: [FileStorageCoreModule.forFeature(namespace)],
          inject: [
            getFileStorageOptionsToken(namespace),
            { token: getFileStorageClientToken(namespace), optional: true },
          ],
          useFactory: (
            { driver }: FileStorageOptions,
            client?: FileStorageClientByDriver<FileStorageDriver>,
          ): MulterOptions => ({
            storage: createMulterStorage(
              driver,
              multerOptions.storage,
              ...((client
                ? [client]
                : []) as MulterStorageDepArg<FileStorageDriver>),
            ),
            limits: multerOptions.limits,
          }),
        }),
      );
    }

    return {
      module: FileStorageModule,
      imports,
      exports: [FileStorageCoreModule, MulterModule],
    };
  }
}
