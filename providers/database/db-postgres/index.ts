import { PostgreSQLDatabaseProvider } from './postgres-database-provider-cb';
import type { PostgreSQLDatabaseConfig } from './postgres-database-provider-cb';
export { PostgreSQLDatabaseProvider, default } from './postgres-database-provider-cb';
export type { PostgreSQLDatabaseConfig, QueryResult } from './postgres-database-provider-cb';
export function createPostgreSQLProvider(
  id: string = 'db-postgres',
  config?: Partial<PostgreSQLDatabaseConfig>
) {
  const { PostgreSQLDatabaseProvider } = require('./postgres-database-provider-cb');
  return new PostgreSQLDatabaseProvider(id, 'PostgreSQL Database', {
    enabled: true,
    config: config || {},
  });
}
export async function initializePostgreSQLProvider(
  id: string = 'db-postgres',
  config?: Partial<PostgreSQLDatabaseConfig>
) {
  const provider = createPostgreSQLProvider(id, config);
  await provider.initialize();
  return provider;
}
