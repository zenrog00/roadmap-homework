import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  initializeTransactionalContext,
  StorageDriver,
} from 'typeorm-transactional';

async function bootstrap() {
  initializeTransactionalContext({ storageDriver: StorageDriver.AUTO });
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.APP_PORT ?? 3000);
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
