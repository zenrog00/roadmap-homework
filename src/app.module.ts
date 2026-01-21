import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validate } from './env';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmConfigService } from './database/typeorm-config-service';
import { AuthModule, AuthModuleOptionsFactory } from './auth';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate }),
    TypeOrmModule.forRootAsync({ useClass: TypeOrmConfigService }),
    AuthModule.forRootAsync({ useClass: AuthModuleOptionsFactory }),
    UsersModule,
  ],
})
export class AppModule {}
