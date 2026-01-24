import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validate } from './env';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmConfigService } from './database/typeorm-config-service';
import { AuthModule, AuthModuleOptionsFactory } from './auth';
import { UsersModule } from './users/users.module';
import { addTransactionalDataSource } from 'typeorm-transactional';
import { DataSource } from 'typeorm';

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
    AuthModule.forRootAsync({ useClass: AuthModuleOptionsFactory }),
    UsersModule,
  ],
})
export class AppModule {}
