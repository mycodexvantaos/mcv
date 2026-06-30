/**
 * MyCodeXvantaOS — Database Port
 * Abstracts relational database operations.
 *
 * Cloudflare implementation: D1 (SQLite)
 * Portable alternatives: PostgreSQL, SQLite, Turso
 *
 * Dependency: depends on @mycodexvantaos/core types only.
 */

// ── Database Port Interface ────────────────────────────────────────────

export interface IDatabasePort {
  /** Execute a write query (INSERT, UPDATE, DELETE) */
  execute(query: string, params?: unknown[]): Promise<DatabaseResult>;

  /** Execute a read query (SELECT) */
  query<T = Record<string, unknown>>(query: string, params?: unknown[]): Promise<T[]>;

  /** Execute a read query returning a single row */
  queryFirst<T = Record<string, unknown>>(query: string, params?: unknown[]): Promise<T | null>;

  /** Execute multiple statements in a transaction */
  batch<T = Record<string, unknown>>(statements: DatabaseStatement[]): Promise<T[][]>;

  /** Run a migration */
  migrate(migrationFile: string): Promise<void>;

  /** Get database metadata for health checks */
  getMetadata(): Promise<DatabaseMetadata>;
}

// ── Supporting Types ───────────────────────────────────────────────────

export interface DatabaseStatement {
  query: string;
  params?: unknown[];
}

export interface DatabaseResult {
  rowsAffected: number;
  lastInsertRowid?: number;
}

export interface DatabaseMetadata {
  provider: string;
  version: string;
  databaseSizeBytes?: number;
  tableCount?: number;
}

// ── Repository Interfaces (one per resource kind) ──────────────────────
// Each repository provides CRUD + list for a specific resource.

export interface IRepository<T> {
  findById(id: string): Promise<T | null>;
  findMany(filter: Record<string, unknown>, limit?: number, offset?: number): Promise<T[]>;
  create(entity: Omit<T, "id">): Promise<T>;
  update(id: string, patch: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
  count(filter?: Record<string, unknown>): Promise<number>;
}
