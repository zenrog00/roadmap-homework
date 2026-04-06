import { Module, DynamicModule } from '@nestjs/common';
import { FileStorageModuleOptions } from './interfaces/file-storage.options';
import { FileStorageCoreModule } from './file-storage-core.module';

@Module({})
export class FilesStorageModule {
  static forRootAsync(options: FileStorageModuleOptions): DynamicModule {
    return {
      module: FilesStorageModule,
      imports: [FileStorageCoreModule.forRootAsync(options)],
    };
  }
}
