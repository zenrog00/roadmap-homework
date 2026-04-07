import { Module, DynamicModule, FactoryProvider } from '@nestjs/common';
import {
  FileStorageAsyncOptions,
  FileStorageDriver,
  FileStorageOptions,
} from './interfaces/file-storage.options';
import { FileStorageCoreModule } from './file-storage-core.module';
import {
  getFileStorageClientToken,
  getFileStorageMulterToken,
  getFileStorageOptionsToken,
} from './utils/file-storage.utils';
import { StorageEngine } from 'multer';
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

  static forFeature(
    namespace: string = 'default',
    multerOptions?: MulterStorageOptionsByDriver<FileStorageDriver>,
  ): DynamicModule {
    const providers: FactoryProvider[] = [];

    if (multerOptions) {
      providers.push(
        this.createMulterStorageProvider(namespace, multerOptions),
      );
    }

    return {
      module: FileStorageModule,
      imports: [FileStorageCoreModule.forFeature(namespace)],
      providers,
      exports: [
        FileStorageCoreModule,
        ...providers.map((p) => p.provide as string),
      ],
    };
  }

  private static createMulterStorageProvider(
    namespace: string,
    options: MulterStorageOptionsByDriver<FileStorageDriver>,
  ): FactoryProvider<StorageEngine> {
    return {
      inject: [
        getFileStorageOptionsToken(namespace),
        { token: getFileStorageClientToken(namespace), optional: true },
      ],
      provide: getFileStorageMulterToken(namespace),
      useFactory: (
        { driver }: FileStorageOptions,
        client?: FileStorageClientByDriver<FileStorageDriver>,
      ) =>
        createMulterStorage(
          driver,
          options,
          ...((client
            ? [client]
            : []) as MulterStorageDepArg<FileStorageDriver>),
        ),
    };
  }
}
