import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validate } from './env';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmConfigService } from './database/typeorm-config-service';
import { AuthModule, AuthModuleOptionsFactory } from './auth';
import { UsersRouterModule } from './users';
import { addTransactionalDataSource } from 'typeorm-transactional';
import { DataSource } from 'typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { FilesStorageConfigService, FileStorageModule } from './file-storage';
import { CacheModule } from '@nestjs/cache-manager';
import { CacheConfigService } from './cache';
import { BullMqConfigService } from './job-queue/bullmq-config.service';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate }),
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
      // eslint-disable-next-line @typescript-eslint/require-await
      dataSourceFactory: async (options) => {
        // options are validated with env-validation, therefore using !
        return addTransactionalDataSource(new DataSource(options!));
      },
    }),
    ScheduleModule.forRoot(),
    AuthModule.forRootAsync({ useClass: AuthModuleOptionsFactory }),
    UsersRouterModule,
    FileStorageModule.forRootAsync({
      useClass: FilesStorageConfigService,
    }),
    CacheModule.registerAsync({
      useClass: CacheConfigService,
      isGlobal: true,
    }),
    BullModule.forRootAsync({
      useClass: BullMqConfigService,
    }),
  ],
})
export class AppModule {}
