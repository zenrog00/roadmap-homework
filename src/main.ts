import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  initializeTransactionalContext,
  StorageDriver,
} from 'typeorm-transactional';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  initializeTransactionalContext({ storageDriver: StorageDriver.AUTO });

  const app = await NestFactory.create(AppModule);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Roadmap homework')
    .setDescription('Roadmap homework API description')
    .setVersion('0.0.1')
    .addBasicAuth()
    .build();
  const documentFactory = () =>
    SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, documentFactory, {
    customSiteTitle: 'Roadmap homework API',
  });

  app.use(cookieParser());
  await app.listen(process.env.APP_PORT ?? 3000);
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
