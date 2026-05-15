/**
 * MyCodeXvantaOS — Cloudflare D1 Adapter
 * Implements IDatabasePort using Cloudflare D1 (SQLite-based serverless database).
 *
 * Category: storage
 * Port: @mycodexvantaos/ports/database
 */

import type {
  IDatabasePort,
  DatabaseStatement,
  DatabaseResult,
  DatabaseMetadata,
  IRepository,
} from '../../ports/database';

// ── D1 Environment Binding ─────────────────────────────────────────────

export interface D1Env {
  DB: D1Database;
}

// ── D1 Database Adapter ────────────────────────────────────────────────

export class CloudflareD1Adapter implements IDatabasePort {
  private db: D1Database;

  constructor(env: D1Env) {
    this.db = env.DB;
  }

  async execute(query: string, params?: unknown[]): Promise<DatabaseResult> {
    const result = await this.db
      .prepare(query)
      .bind(...(params ?? []))
      .run();
    return {
      rowsAffected: result.meta.changes,
      lastInsertRowid: result.meta.last_row_id,
    };
  }

  async query<T = Record<string, unknown>>(query: string, params?: unknown[]): Promise<T[]> {
    const result = await this.db
      .prepare(query)
      .bind(...(params ?? []))
      .all();
    return (result.results as T[]) ?? [];
  }

  async queryFirst<T = Record<string, unknown>>(
    query: string,
    params?: unknown[]
  ): Promise<T | null> {
    const result = await this.db
      .prepare(query)
      .bind(...(params ?? []))
      .first<T>();
    return result ?? null;
  }

  async batch<T = Record<string, unknown>>(statements: DatabaseStatement[]): Promise<T[][]> {
    const batchResults = await this.db.batch(
      statements.map((stmt) => this.db.prepare(stmt.query).bind(...(stmt.params ?? [])))
    );
    return batchResults.map((result) => (result.results as T[]) ?? []);
  }

  async migrate(migrationFile: string): Promise<void> {
    await this.execute(
      `CREATE TABLE IF NOT EXISTS _migrations (
        id TEXT PRIMARY KEY,
        applied_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`
    );
    const existing = await this.queryFirst('SELECT id FROM _migrations WHERE id = ?', [
      migrationFile,
    ]);
    if (!existing) {
      await this.execute('INSERT INTO _migrations (id) VALUES (?)', [migrationFile]);
    }
  }

  async getMetadata(): Promise<DatabaseMetadata> {
    const tables = await this.query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE '_%'"
    );
    return { provider: 'cloudflare-d1', version: 'sqlite-3', tableCount: tables.length };
  }
}

// ── D1 Repository Base ─────────────────────────────────────────────────

export class D1Repository<T extends { id: string }> implements IRepository<T> {
  constructor(
    private db: D1Database,
    private tableName: string
  ) {}

  async findById(id: string): Promise<T | null> {
    return (
      this.db.prepare(`SELECT * FROM ${this.tableName} WHERE id = ?`).bind(id).first<T>() ?? null
    );
  }

  async findMany(filter: Record<string, unknown>, limit = 100, offset = 0): Promise<T[]> {
    const conditions = Object.keys(filter)
      .map((k) => `${k} = ?`)
      .join(' AND ');
    const params = Object.values(filter);
    const result = await this.db
      .prepare(`SELECT * FROM ${this.tableName} WHERE ${conditions} LIMIT ? OFFSET ?`)
      .bind(...params, limit, offset)
      .all();
    return (result.results as T[]) ?? [];
  }

  async create(entity: Omit<T, 'id'>): Promise<T> {
    const id = crypto.randomUUID();
    const keys = ['id', ...Object.keys(entity)];
    const values = [id, ...Object.values(entity)];
    const placeholders = keys.map(() => '?').join(', ');
    await this.db
      .prepare(`INSERT INTO ${this.tableName} (${keys.join(', ')}) VALUES (${placeholders})`)
      .bind(...values)
      .run();
    return { id, ...entity } as T;
  }

  async update(id: string, patch: Partial<T>): Promise<T> {
    const sets = Object.keys(patch)
      .map((k) => `${k} = ?`)
      .join(', ');
    const values = [...Object.values(patch), id];
    await this.db
      .prepare(`UPDATE ${this.tableName} SET ${sets} WHERE id = ?`)
      .bind(...values)
      .run();
    return this.findById(id) as Promise<T>;
  }

  async delete(id: string): Promise<void> {
    await this.db.prepare(`DELETE FROM ${this.tableName} WHERE id = ?`).bind(id).run();
  }

  async count(filter?: Record<string, unknown>): Promise<number> {
    const where = filter
      ? `WHERE ${Object.keys(filter)
          .map((k) => `${k} = ?`)
          .join(' AND ')}`
      : '';
    const params = filter ? Object.values(filter) : [];
    const result = await this.db
      .prepare(`SELECT COUNT(*) as count FROM ${this.tableName} ${where}`)
      .bind(...params)
      .first<{ count: number }>();
    return result?.count ?? 0;
  }
}
