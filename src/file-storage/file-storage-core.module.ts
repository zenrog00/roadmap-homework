import {
  Module,
  DynamicModule,
  FactoryProvider,
  Provider,
} from '@nestjs/common';
import {
  FileStorageAsyncOptions,
  FileStorageDriver,
  FileStorageOptions,
  FileStorageModuleOptions,
  FileStorageOptionsFactory,
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
} from './factories/file-storage-client.factory';
import { FileStorageService } from './file-storage.service';
import {
  createFileStorageService,
  FileStorageClientArg,
} from './factories/file-storage-service.factory';

@Module({})
export class FileStorageCoreModule {
  private static readonly featureModules = new Map<string, DynamicModule>();

  static forRootAsync(options: FileStorageAsyncOptions): DynamicModule {
    const providers = this.createAsyncOptionsProvider(options);

    return {
      module: FileStorageCoreModule,
      global: true,
      providers,
      exports: [FILE_STORAGE_OPTIONS],
    };
  }

  static forFeature(namespace: string = 'default'): DynamicModule {
    const cachedModule = this.featureModules.get(namespace);

    if (cachedModule) {
      return cachedModule;
    }

    const providers: FactoryProvider[] = [
      this.createFileStorageOptionsProvider(namespace),
      this.createFileStorageClientProvider(namespace),
      this.createFileStorageServiceProvider(namespace),
    ];
    const dynamicModule: DynamicModule = {
      module: FileStorageCoreModule,
      providers,
      exports: [
        getFileStorageOptionsToken(namespace),
        getFileStorageClientToken(namespace),
        getFileStorageServiceToken(namespace),
      ],
    };
    this.featureModules.set(namespace, dynamicModule);

    return dynamicModule;
  }

  private static createAsyncOptionsProvider(
    options: FileStorageAsyncOptions,
  ): Provider[] {
    const { useClass } = options;

    return [
      // providing factory with useClass
      // so Nest can instantiate it with right dependencies
      {
        provide: useClass,
        useClass,
      },
      {
        provide: FILE_STORAGE_OPTIONS,
        inject: [useClass],
        useFactory: (optionsFactory: FileStorageOptionsFactory) => {
          const options = optionsFactory.createFileStorageOptions();
          this.validateOptionsNamespaces(options);
          return options;
        },
      },
    ];
  }

  private static validateOptionsNamespaces(
    options: FileStorageModuleOptions,
  ): void {
    const seen = new Set<string>();

    options.forEach((storageOptions) => {
      const { namespace = 'default' } = storageOptions;

      if (seen.has(namespace)) {
        throw new Error(`File storage namespace ${namespace} is not unique!`);
      }
      seen.add(namespace);
    });
  }

  private static createFileStorageOptionsProvider(
    namespace: string,
  ): FactoryProvider<FileStorageOptions> {
    return {
      inject: [FILE_STORAGE_OPTIONS],
      provide: getFileStorageOptionsToken(namespace),
      useFactory: (options: FileStorageModuleOptions) => {
        const storageOptions = options.find(
          ({ namespace: optionNamespace = 'default' }) =>
            optionNamespace === namespace,
        );

        if (!storageOptions) {
          throw new Error(`Missing file storage namespace: ${namespace}`);
        }

        return storageOptions;
      },
    };
  }

  private static createFileStorageClientProvider(
    namespace: string,
  ): FactoryProvider<FileStorageClientByDriver<FileStorageDriver> | undefined> {
    return {
      inject: [getFileStorageOptionsToken(namespace)],
      provide: getFileStorageClientToken(namespace),
      useFactory: (options: FileStorageOptions) => {
        if ('client' in options && options.client) {
          return createFileStorageClient(options.driver, options.client);
        }
      },
    };
  }

  private static createFileStorageServiceProvider(
    namespace: string,
  ): FactoryProvider<FileStorageService> {
    return {
      inject: [
        getFileStorageOptionsToken(namespace),
        { token: getFileStorageClientToken(namespace), optional: true },
      ],
      provide: getFileStorageServiceToken(namespace),
      useFactory: (
        options: FileStorageOptions,
        client?: FileStorageClientByDriver<'s3'>,
      ) => {
        return createFileStorageService(
          options.driver,
          ...((client
            ? [client]
            : []) as FileStorageClientArg<FileStorageDriver>),
        );
      },
    };
  }
}
