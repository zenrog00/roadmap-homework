import { Module, DynamicModule } from '@nestjs/common';
import { FileStorageModuleOptions } from './interfaces/file-storage.options';
import { FileStorageCoreModule } from './file-storage-core.module';
import {
  getFileStorageOptionsToken,
  getFileStorageServiceToken,
} from './utils/file-storage.utils';
import { FILE_STORAGE_OPTIONS } from './constants';

@Module({})
export class FilesStorageModule {
  static forRootAsync(options: FileStorageModuleOptions): DynamicModule {
    return {
      module: FilesStorageModule,
      imports: [FileStorageCoreModule.forRootAsync(options)],
      exports: [FILE_STORAGE_OPTIONS],
    };
  }

  static forFeature(namespace: string = 'default'): DynamicModule {
    const storageToken = getFileStorageServiceToken(namespace);
    const namespaceOptionsToken = getFileStorageOptionsToken(namespace);

    return {
      module: FilesStorageModule,
      exports: [storageToken, namespaceOptionsToken],
    };
  }
}
