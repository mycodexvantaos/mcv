/**
 * Cloudflare R2 Storage Adapter
 * Implements IStoragePort using Cloudflare R2 (S3-compatible object storage).
 */

import type {
  IStoragePort,
  StoragePutOptions,
  StoragePutResult,
  StorageMetadata,
  StorageListOptions,
  StorageListResult,
} from '../../ports/index';
import type { CloudflareEnv } from './index';

export class CloudflareStorageAdapter implements IStoragePort {
  private bucket: R2Bucket;

  constructor(env: CloudflareEnv) {
    this.bucket = env.BUCKET;
  }

  async put(bucket: string, key: string, data: Uint8Array, options?: StoragePutOptions): Promise<StoragePutResult> {
    const result = await this.bucket.put(key, data, {
      httpMetadata: options?.contentType ? { contentType: options.contentType } : undefined,
      customMetadata: options?.metadata,
    });

    return {
      key: result.key,
      etag: result.etag,
      sizeBytes: result.size,
    };
  }

  async get(bucket: string, key: string): Promise<Uint8Array | null> {
    const object = await this.bucket.get(key);
    if (!object) return null;
    const arrayBuffer = await object.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  }

  async delete(bucket: string, key: string): Promise<void> {
    await this.bucket.delete(key);
  }

  async exists(bucket: string, key: string): Promise<boolean> {
    const object = await this.bucket.head(key);
    return object !== null;
  }

  async getMetadata(bucket: string, key: string): Promise<StorageMetadata | null> {
    const object = await this.bucket.head(key);
    if (!object) return null;

    return {
      key: object.key,
      sizeBytes: object.size,
      contentType: object.httpMetadata?.contentType ?? 'application/octet-stream',
      lastModified: object.uploaded.toISOString(),
      etag: object.etag,
      customMetadata: object.customMetadata ?? {},
    };
  }

  async list(bucket: string, options?: StorageListOptions): Promise<StorageListResult> {
    const listed = await this.bucket.list({
      prefix: options?.prefix,
      limit: options?.limit,
      cursor: options?.cursor,
    });

    return {
      keys: listed.objects.map((obj) => obj.key),
      cursor: listed.truncated ? listed.cursor : undefined,
      truncated: listed.truncated,
    };
  }

  async getPresignedUrl(bucket: string, key: string, expiresIn: number): Promise<string> {
    // R2 presigned URLs require the S3 API compatibility endpoint
    // In Workers, we generate a temporary URL via the R2 public URL or
    // create a signed URL using the R2 API
    // For MVP, we return a direct URL via the worker route
    return `/api/v1/storage/${bucket}/${key}?expires=${Date.now() + expiresIn * 1000}`;
  }
}
