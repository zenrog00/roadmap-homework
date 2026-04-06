import {
  Module,
  DynamicModule,
  Provider,
  FactoryProvider,
} from '@nestjs/common';
import {
  FileStorageDriver,
  FileStorageModuleOptions,
} from './interfaces/file-storage.options';
import {
  getFileStorageClientToken,
  getFileStorageToken,
} from './utils/file-storage.utils';
import { FILE_STORAGE_OPTIONS } from './constants';
import {
  createFileStorageClient,
  FileStorageClientByDriver,
  FileStorageClientOptionsByDriver,
} from './factories/file-storage-client.factory';
import { FileStorage } from './file-storage';
import {
  createFileStorage,
  FileStorageClientArg,
} from './factories/file-storage.factory';

@Module({})
export class FileStorageCoreModule {
  static forRootAsync(options: FileStorageModuleOptions): DynamicModule {
    const fileStorageOptionsProviders =
      this.createAsyncOptionsProviders(options);
    const fileStorageClientProviders: Provider[] = [];
    const fileStorageProviders: Provider[] = [];

    options.forEach((storageOptions) => {
      const fileStorageToken = getFileStorageToken(
        storageOptions.driver,
        storageOptions.namespace,
      );
      fileStorageProviders.push({
        provide: fileStorageToken,
        useFactory: () => {},
      });
    });
  }

  private static createFileStorageAsyncProviders(
    options: FileStorageModuleOptions,
  ): Provider[] {
    const fileStorageAsyncProviders: Provider[] = [
      this.createAsyncOptionsProvider(options),
    ];

    const namespacesCount = new Map<string, number>();

    options.forEach(({ driver, namespace = 'default', client }) => {
      if (namespacesCount.has(namespace)) {
        throw new Error(`File storage namespace ${namespace} is not unique!`);
      }
      namespacesCount.set(namespace, 1);

      fileStorageAsyncProviders.push(
        // creating client first because it may be required by storage
        ...(client
          ? [this.createFileStorageClientProvider(driver, client, namespace)]
          : []),
        this.createFileStorageProvider(driver, namespace),
      );
    });

    return fileStorageAsyncProviders;
  }

  private static createAsyncOptionsProvider(
    options: FileStorageModuleOptions,
  ): FactoryProvider<FileStorageModuleOptions> {
    return {
      provide: FILE_STORAGE_OPTIONS,
      useFactory: () => options,
    };
  }

  private static createFileStorageClientProvider<D extends FileStorageDriver>(
    driver: D,
    options: FileStorageClientOptionsByDriver<D>,
    namespace?: string,
  ): FactoryProvider<FileStorageClientByDriver<D>> {
    return {
      provide: getFileStorageClientToken(namespace),
      useFactory: () => createFileStorageClient(driver, options),
    };
  }

  private static createFileStorageProvider<D extends FileStorageDriver>(
    driver: D,
    namespace?: string,
  ): FactoryProvider<FileStorage> {
    return {
      inject: [{ token: getFileStorageClientToken(namespace), optional: true }],
      provide: getFileStorageToken(namespace),
      useFactory: (client: FileStorageClientByDriver<D>) =>
        createFileStorage(
          driver,
          ...((client ? [client] : []) as FileStorageClientArg<D>),
        ),
    };
  }
}
