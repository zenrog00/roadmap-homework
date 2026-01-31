import { PostgreSqlContainer } from '@testcontainers/postgresql';

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
}
