// manually load custom paths from tsconfig
import 'tsconfig-paths/register';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { DataSource } from 'typeorm';

export default async function globalSetup() {
  const postgresContainer = await new PostgreSqlContainer(
    'postgres:18',
  ).start();

  globalThis.postgresContainer = postgresContainer;

  // setting container config to env because it's only way
  // to pass config to test files
  process.env.POSTGRES_HOST = postgresContainer.getHost();
  process.env.POSTGRES_PORT = postgresContainer.getPort().toString();
  process.env.POSTGRES_USER = postgresContainer.getUsername();
  process.env.POSTGRES_PASSWORD = postgresContainer.getPassword();
  process.env.POSTGRES_DB = postgresContainer.getPassword();

  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.POSTGRES_HOST,
    port: Number(process.env.POSTGRES_PORT),
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DATABASE,
    entities: ['src/**/*.entity.ts'],
  });

  try {
    await dataSource.initialize();
    await dataSource.synchronize(true);
  } catch (error) {
    console.error('Error during global setup database sync:', error);
    throw error;
  } finally {
    await dataSource.destroy();
  }
}
