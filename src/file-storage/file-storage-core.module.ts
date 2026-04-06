import { Module, DynamicModule, FactoryProvider } from '@nestjs/common';
import {
  FileStorageDriver,
  FileStorageModuleOptions,
  FileStorageOptionsByDriver,
} from './interfaces/file-storage.options';
import {
  getFileStorageClientToken,
  getFileStorageOptionsToken,
  getFileStorageServiceToken,
} from './utils/file-storage.utils';
import { FILE_STORAGE_OPTIONS } from './constants';
import {
  createFileStorageClient,
  FileStorageClientByDriver,
  FileStorageClientOptionsByDriver,
} from './factories/file-storage-client.factory';
import { FileStorageService } from './file-storage.service';
import {
  createFileStorageService,
  FileStorageClientArg,
} from './factories/file-storage-service.factory';

@Module({})
export class FileStorageCoreModule {
  static forRootAsync(options: FileStorageModuleOptions): DynamicModule {
    const providers = this.createFileStorageAsyncProviders(options);
    const exports = providers.map(({ provide }) => provide);

    return {
      module: FileStorageCoreModule,
      providers,
      exports,
    };
  }

  private static createFileStorageAsyncProviders(
    options: FileStorageModuleOptions,
  ): FactoryProvider[] {
    const fileStorageAsyncProviders: FactoryProvider[] = [
      this.createAsyncOptionsProvider(options),
    ];

    const namespacesCount = new Map<string, number>();

    options.forEach((storageOptions) => {
      const { driver, namespace = 'default', client } = storageOptions;

      if (namespacesCount.has(namespace)) {
        throw new Error(`File storage namespace ${namespace} is not unique!`);
      }
      namespacesCount.set(namespace, 1);

      fileStorageAsyncProviders.push(
        this.createFileStorageOptionsProvider(storageOptions),
        // creating client first because it may be required by storage
        ...(client
          ? [this.createFileStorageClientProvider(driver, client, namespace)]
          : []),
        this.createFileStorageServiceProvider(driver, namespace),
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

  private static createFileStorageOptionsProvider<D extends FileStorageDriver>(
    storageOptions: FileStorageOptionsByDriver<D>,
  ): FactoryProvider<FileStorageOptionsByDriver<D>> {
    return {
      provide: getFileStorageOptionsToken(storageOptions.namespace),
      useFactory: () => storageOptions,
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

  private static createFileStorageServiceProvider<D extends FileStorageDriver>(
    driver: D,
    namespace?: string,
  ): FactoryProvider<FileStorageService> {
    return {
      inject: [{ token: getFileStorageClientToken(namespace), optional: true }],
      provide: getFileStorageServiceToken(namespace),
      useFactory: (client: FileStorageClientByDriver<D>) =>
        createFileStorageService(
          driver,
          ...((client ? [client] : []) as FileStorageClientArg<D>),
        ),
    };
  }
}
