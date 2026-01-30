import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import axios, { AxiosInstance } from 'axios';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { TypeOrmConfigService } from 'src/database/typeorm-config-service';
import {
  initializeTransactionalContext,
  StorageDriver,
} from 'typeorm-transactional';

let app: INestApplication;
let api: AxiosInstance;
let postgresContainer: StartedPostgreSqlContainer;

beforeAll(async () => {
  postgresContainer = await new PostgreSqlContainer('postgres:18').start();

  // typeorm-transactional async context initialization
  initializeTransactionalContext({ storageDriver: StorageDriver.AUTO });

  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(TypeOrmConfigService)
    .useValue({
      createTypeOrmOptions: () => ({
        type: 'postgres',
        host: postgresContainer.getHost(),
        port: postgresContainer.getPort(),
        username: postgresContainer.getUsername(),
        password: postgresContainer.getPassword(),
        database: postgresContainer.getDatabase(),
        autoLoadEntities: true,
        synchronize: true,
      }),
    })
    .compile();

  app = moduleFixture.createNestApplication();
  await app.init();
  await app.listen(0);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  const port = app.getHttpServer().address().port;
  const axiosConfig = {
    baseURL: `http://127.0.0.1:${port}`,
    validateStatus: () => true,
  };
  api = axios.create(axiosConfig);
});

afterAll(async () => {
  await app.close();
  await postgresContainer.stop();
});

describe('api', () => {
  describe('GET /', () => {
    it('should return 404 on / route', async () => {
      const response = await api.get('/');

      expect(response).toMatchObject({
        status: 404,
      });
    });
  });
});
