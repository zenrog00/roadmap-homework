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
  MulterStorageOptionsByDriver,
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

  static forFeature(namespace?: string): DynamicModule;
  static forFeature<D extends FileStorageDriver>(
    namespace: string,
    // I can't enforce multerOptions typing strictness
    // without passing driver explicitly
    // maybe it's possible, idk
    driver: D,
    multerOptions: FileStorageMulterOptions<D>,
  ): DynamicModule;
  static forFeature<D extends FileStorageDriver>(
    namespace: string = 'default',
    driver?: D,
    multerOptions?: FileStorageMulterOptions<D>,
  ): DynamicModule {
    const imports: DynamicModule[] = [
      FileStorageCoreModule.forFeature(namespace),
    ];

    if (driver && multerOptions) {
      imports.push(
        MulterModule.registerAsync({
          imports: [FileStorageCoreModule.forFeature(namespace)],
          inject: [
            getFileStorageOptionsToken(namespace),
            { token: getFileStorageClientToken(namespace), optional: true },
          ],
          useFactory: (
            options: FileStorageOptions,
            client?: FileStorageClientByDriver<FileStorageDriver>,
          ): MulterOptions => {
            if (options.driver !== driver) {
              throw new Error(
                `File storage namespace "${namespace}" uses driver "${options.driver}", but multer was configured for "${driver}"`,
              );
            }

            return {
              storage: createMulterStorage(
                options.driver,
                multerOptions.storage as MulterStorageOptionsByDriver<FileStorageDriver>,
                ...((client
                  ? [client]
                  : []) as MulterStorageDepArg<FileStorageDriver>),
              ),
              limits: multerOptions.limits,
            };
          },
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
