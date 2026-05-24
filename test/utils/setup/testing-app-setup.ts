import { INestApplication } from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import cookieParser from 'cookie-parser';
import { Server } from 'node:net';
import { AppModule } from 'src/app.module';
import { TypeOrmConfigService } from 'src/database/typeorm-config-service';
import {
  initializeTransactionalContext,
  StorageDriver,
} from 'typeorm-transactional';

// No-op cache used in e2e tests so that responses are never served from
// cache and tests remain deterministic regardless of execution order.
const noopCacheManager = {
  get: () => Promise.resolve(undefined),
  set: <T>(_key: string, value: T) => Promise.resolve(value),
  del: () => Promise.resolve(true),
} as unknown as Cache;

// getting config from env variables that were setup in global-setup
const typeOrmOptions: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATABASE,
  autoLoadEntities: true,
};

export function getAppPort(app: INestApplication<Server>) {
  const serverAddress = app.getHttpServer().address();
  if (serverAddress && typeof serverAddress !== 'string') {
    return serverAddress.port;
  }
  throw new Error('Could not determine port of a running app');
}

export async function testingAppSetup() {
  initializeTransactionalContext({ storageDriver: StorageDriver.AUTO });

  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(TypeOrmConfigService)
    .useValue({
      createTypeOrmOptions: () => typeOrmOptions,
    })
    .overrideProvider(CACHE_MANAGER)
    .useValue(noopCacheManager)
    .compile();

  const app = moduleFixture.createNestApplication<NestExpressApplication>();
  app.use(cookieParser());
  await app.init();
  await app.listen(0);

  return app;
}
