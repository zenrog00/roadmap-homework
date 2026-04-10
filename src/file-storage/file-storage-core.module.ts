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
  FileStorageServiceCtorArg,
} from './factories/file-storage-service.factory';

@Module({})
export class FileStorageCoreModule {
  private static readonly featureModules = new Map<string, DynamicModule>();
  private static readonly clientInstances = new Map<
    string,
    FileStorageClientByDriver<FileStorageDriver>
  >();

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

    options.forEach((storageOptions) => {
      if ('useClientFrom' in storageOptions) {
        const ref = storageOptions.useClientFrom;
        if (!seen.has(ref)) {
          throw new Error(
            `File storage namespace "${storageOptions.namespace ?? 'default'}" references client from "${ref}", which does not exist`,
          );
        }
      }
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
      inject: [FILE_STORAGE_OPTIONS, getFileStorageOptionsToken(namespace)],
      provide: getFileStorageClientToken(namespace),
      useFactory: (
        allOptions: FileStorageModuleOptions,
        options: FileStorageOptions,
      ) => {
        const sourceNamespace =
          'useClientFrom' in options ? options.useClientFrom : namespace;

        const cached = this.clientInstances.get(sourceNamespace);
        if (cached) return cached;

        const sourceOptions =
          sourceNamespace === namespace
            ? options
            : allOptions.find(
                (o) => (o.namespace ?? 'default') === sourceNamespace,
              );

        if (!sourceOptions || !('client' in sourceOptions)) {
          if ('useClientFrom' in options) {
            throw new Error(
              `Namespace "${namespace}" references client from "${sourceNamespace}", but no client config was found`,
            );
          }
          return undefined;
        }

        const client = createFileStorageClient(
          sourceOptions.driver,
          sourceOptions.client,
        );
        this.clientInstances.set(sourceNamespace, client);
        return client;
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
            ? [namespace, client]
            : [namespace]) as FileStorageServiceCtorArg<FileStorageDriver>),
        );
      },
    };
  }
}
