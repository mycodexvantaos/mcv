/**
 * MyCodeXvantaOS — Cloudflare KV Adapter
 * Implements ICachePort using Cloudflare KV (eventually-consistent key-value store).
 *
 * Category: storage
 * Port: @mycodexvantaos/ports/database (cache interface)
 */

// ── KV Environment Binding ─────────────────────────────────────────────

export interface KVEnv {
  KV: KVNamespace;
}

// ── KV Cache Store ─────────────────────────────────────────────────────

export class CloudflareKVCacheStore {
  private kv: KVNamespace;

  constructor(env: KVEnv) {
    this.kv = env.KV;
  }

  async get<T = string>(key: string): Promise<T | null> {
    const value = await this.kv.get(key, "text");
    if (value === null) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  }

  async put(
    key: string,
    value: unknown,
    options?: { expirationTtl?: number; metadata?: Record<string, string> }
  ): Promise<void> {
    const serialized = typeof value === "string" ? value : JSON.stringify(value);
    await this.kv.put(key, serialized, {
      expirationTtl: options?.expirationTtl,
      metadata: options?.metadata,
    });
  }

  async delete(key: string): Promise<void> {
    await this.kv.delete(key);
  }

  async list(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<{
    keys: string[];
    cursor?: string;
    list_complete: boolean;
  }> {
    const listed = await this.kv.list({
      prefix: options?.prefix,
      limit: options?.limit,
      cursor: options?.cursor,
    });
    return {
      keys: listed.keys.map((k) => k.name),
      cursor: listed.list_complete ? undefined : listed.cursor,
      list_complete: listed.list_complete,
    };
  }

  async atomicSet(
    key: string,
    expectedValue: unknown,
    newValue: unknown,
    options?: { expirationTtl?: number }
  ): Promise<boolean> {
    const existing = await this.kv.getWithMetadata<{ revision: number }>(key);
    const expectedRevision = typeof expectedValue === "number" ? expectedValue : 0;
    const currentRevision = existing.metadata?.revision ?? 0;
    if (currentRevision !== expectedRevision) return false;
    const serialized = typeof newValue === "string" ? newValue : JSON.stringify(newValue);
    const newRevision = currentRevision + 1;
    await this.kv.put(key, serialized, {
      expirationTtl: options?.expirationTtl,
      metadata: { revision: newRevision },
    });
    return true;
  }
}

// ── KV Session Store ───────────────────────────────────────────────────

export interface SessionData {
  sessionId: string;
  subjectId: string;
  workspaceId: string;
  role: string;
  createdAt: string;
  expiresAt: string;
}

export class CloudflareKVSessionStore {
  private kv: KVNamespace;

  constructor(env: KVEnv) {
    this.kv = env.KV;
  }

  async createSession(session: SessionData): Promise<void> {
    await this.kv.put(`session:${session.sessionId}`, JSON.stringify(session), {
      expirationTtl: 86400, // 24 hours
    });
  }

  async getSession(sessionId: string): Promise<SessionData | null> {
    const data = await this.kv.get(`session:${sessionId}`, "text");
    return data ? JSON.parse(data) : null;
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.kv.delete(`session:${sessionId}`);
  }
}
