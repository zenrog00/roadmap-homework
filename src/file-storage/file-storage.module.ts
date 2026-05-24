import { Module, DynamicModule } from '@nestjs/common';
import {
  FileStorageAsyncOptions,
  FileStorageDriver,
  FileStorageMulterAsyncOptions,
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
    driver: D,
    multerOptions: FileStorageMulterAsyncOptions<D>,
  ): DynamicModule;
  static forFeature<D extends FileStorageDriver>(
    namespace: string = 'default',
    driver?: D,
    multerOptions?: FileStorageMulterAsyncOptions<D>,
  ): DynamicModule {
    const imports: DynamicModule[] = [
      FileStorageCoreModule.forFeature(namespace),
    ];

    if (driver && multerOptions) {
      const declaredDriver = driver;

      imports.push(
        MulterModule.registerAsync({
          imports: [
            FileStorageCoreModule.forFeature(namespace),
            ...(multerOptions.imports ?? []),
          ],
          inject: [
            getFileStorageOptionsToken(namespace),
            { token: getFileStorageClientToken(namespace), optional: true },
            ...(multerOptions.inject ?? []),
          ],
          useFactory: async (
            options: FileStorageOptions,
            client: FileStorageClientByDriver<FileStorageDriver> | undefined,
            ...extraArgs: unknown[]
          ): Promise<MulterOptions> => {
            if (options.driver !== declaredDriver) {
              throw new Error(
                `File storage namespace "${namespace}" uses driver "${options.driver}", but multer was configured for "${declaredDriver}"`,
              );
            }

            const resolved = await multerOptions.useFactory(...extraArgs);

            return {
              storage: createMulterStorage(
                options.driver,
                resolved.storage as MulterStorageOptionsByDriver<FileStorageDriver>,
                ...((client
                  ? [client]
                  : []) as MulterStorageDepArg<FileStorageDriver>),
              ),
              limits: resolved.limits,
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
