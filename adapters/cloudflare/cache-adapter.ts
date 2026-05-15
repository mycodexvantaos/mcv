/**
 * Cloudflare KV Cache Adapter
 * Implements ICachePort using Cloudflare KV (eventually-consistent key-value store).
 */

import type {
  ICachePort,
  CachePutOptions,
  CacheListOptions,
  CacheListResult,
} from '../../ports/index';
import type { CloudflareEnv } from './index';

export class CloudflareCacheAdapter implements ICachePort {
  private kv: KVNamespace;

  constructor(env: CloudflareEnv) {
    this.kv = env.KV;
  }

  async get<T = string>(key: string): Promise<T | null> {
    const value = await this.kv.get(key, 'text');
    if (value === null) return null;

    try {
      // Attempt to parse as JSON; fall back to raw string
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  }

  async put(key: string, value: unknown, options?: CachePutOptions): Promise<void> {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);

    await this.kv.put(key, serialized, {
      expirationTtl: options?.expirationTtl,
      metadata: options?.metadata,
    });
  }

  async delete(key: string): Promise<void> {
    await this.kv.delete(key);
  }

  async list(options?: CacheListOptions): Promise<CacheListResult> {
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
    options?: CachePutOptions
  ): Promise<boolean> {
    // KV does not natively support CAS. We implement a best-effort version
    // using the metadata field as a revision counter.
    const existing = await this.kv.getWithMetadata<{ revision: number }>(key);

    const expectedRevision = typeof expectedValue === 'number' ? expectedValue : 0;
    const currentRevision = existing.metadata?.revision ?? 0;

    if (currentRevision !== expectedRevision) {
      return false;
    }

    const serialized = typeof newValue === 'string' ? newValue : JSON.stringify(newValue);
    const newRevision = currentRevision + 1;

    await this.kv.put(key, serialized, {
      expirationTtl: options?.expirationTtl,
      metadata: { revision: newRevision, ...options?.metadata },
    });

    return true;
  }
}
