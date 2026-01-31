import { Test } from '@nestjs/testing';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AppModule } from 'src/app.module';
import { TypeOrmConfigService } from 'src/database/typeorm-config-service';
import {
  initializeTransactionalContext,
  StorageDriver,
} from 'typeorm-transactional';

// getting config from env variables that were setup in global-setup
const typeOrmOptions: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATABASE,
  autoLoadEntities: true,
  synchronize: true,
};

export async function testingAppSetup() {
  initializeTransactionalContext({ storageDriver: StorageDriver.AUTO });

  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(TypeOrmConfigService)
    .useValue({
      createTypeOrmOptions: () => typeOrmOptions,
    })
    .compile();

  const app = moduleFixture.createNestApplication();
  await app.init();
  await app.listen(0);

  return app;
}
