import { SQLiteDatabaseProvider } from './sqlite-database-provider-cb';
import type { SQLiteDatabaseConfig } from './sqlite-database-provider-cb';
export { SQLiteDatabaseProvider, default } from './sqlite-database-provider-cb';
export type { SQLiteDatabaseConfig, QueryResult } from './sqlite-database-provider-cb';
export function createSQLiteProvider(id: string = 'db-sqlite', config?: Partial<SQLiteDatabaseConfig>) {
  const { SQLiteDatabaseProvider } = require('./sqlite-database-provider-cb');
  return new SQLiteDatabaseProvider(id, 'SQLite Database', { enabled: true, config: config || {} });
}
export async function initializeSQLiteProvider(id: string = 'db-sqlite', config?: Partial<SQLiteDatabaseConfig>) {
  const provider = createSQLiteProvider(id, config);
  await provider.initialize();
  return provider;
}
