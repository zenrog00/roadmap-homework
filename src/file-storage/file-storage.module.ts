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
  getFileStorageServiceToken,
} from './utils/file-storage.utils';
import { FILE_STORAGE_OPTIONS } from './constants';
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
      exports: [FILE_STORAGE_OPTIONS],
    };
  }

  static forFeature(
    namespace: string = 'default',
    multerOptions?: MulterStorageOptionsByDriver<FileStorageDriver>,
  ): DynamicModule {
    const storageToken = getFileStorageServiceToken(namespace);
    const namespaceOptionsToken = getFileStorageOptionsToken(namespace);

    const providers: FactoryProvider[] = [];
    const exports: string[] = [storageToken, namespaceOptionsToken];

    if (multerOptions) {
      providers.push(
        this.createMulterStorageProvider(namespace, multerOptions),
      );
      exports.push(getFileStorageMulterToken(namespace));
    }

    return {
      module: FileStorageModule,
      providers,
      exports,
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
