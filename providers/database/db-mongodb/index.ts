import { MongoDatabaseProvider } from './mongodb-database-provider-cb';
import type { MongoDatabaseConfig } from './mongodb-database-provider-cb';
export { MongoDatabaseProvider, default } from './mongodb-database-provider-cb';
export type { MongoDatabaseConfig, QueryResult } from './mongodb-database-provider-cb';
export function createMongoProvider(id: string = 'db-mongodb', config?: Partial<MongoDatabaseConfig>) {
  const { MongoDatabaseProvider } = require('./mongodb-database-provider-cb');
  return new MongoDatabaseProvider(id, 'MongoDB Database', { enabled: true, config: config || {} });
}
export async function initializeMongoProvider(id: string = 'db-mongodb', config?: Partial<MongoDatabaseConfig>) {
  const provider = createMongoProvider(id, config);
  await provider.initialize();
  return provider;
}
