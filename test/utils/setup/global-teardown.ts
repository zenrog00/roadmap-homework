export default async function globalTeardown() {
  const postgresContainer = globalThis.postgresContainer;
  if (postgresContainer) {
    await postgresContainer.stop();
  }
}
