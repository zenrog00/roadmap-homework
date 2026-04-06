import { Module, DynamicModule, Provider } from '@nestjs/common';
import { FileStorageModuleOptions } from './interfaces/file-storage.options';
import { getFileStorageToken } from './utils/file-storage.utils';
import { FILE_STORAGE_OPTIONS } from './constants';

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

  private static createAsyncOptionsProviders(
    options: FileStorageModuleOptions,
  ): Provider[] {
    return [
      {
        provide: FILE_STORAGE_OPTIONS,
        useFactory: () => options,
      },
    ];
  }
}
