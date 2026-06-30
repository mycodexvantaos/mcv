/**
 * MyCodeXvantaOS — Cloudflare R2 Adapter
 * Implements IObjectStoragePort using Cloudflare R2 (S3-compatible object storage).
 *
 * Category: storage
 * Port: @mycodexvantaos/ports/object-storage
 */

import type {
  IObjectStoragePort,
  StoragePutOptions,
  StoragePutResult,
  StorageMetadata,
  StorageListOptions,
  StorageListResult,
} from "../../ports/object-storage";

// ── R2 Environment Binding ─────────────────────────────────────────────

export interface R2Env {
  BUCKET: R2Bucket;
}

// ── R2 Object Storage Adapter ──────────────────────────────────────────

export class CloudflareR2Adapter implements IObjectStoragePort {
  private bucket: R2Bucket;

  constructor(env: R2Env) {
    this.bucket = env.BUCKET;
  }

  async put(
    bucket: string,
    key: string,
    data: Uint8Array,
    options?: StoragePutOptions
  ): Promise<StoragePutResult> {
    const result = await this.bucket.put(key, data, {
      httpMetadata: options?.contentType ? { contentType: options.contentType } : undefined,
      customMetadata: options?.metadata,
    });
    return { key: result.key, etag: result.etag, sizeBytes: result.size };
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
      contentType: object.httpMetadata?.contentType ?? "application/octet-stream",
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
    // R2 presigned URLs via worker route for MVP
    return `/api/v1/storage/${bucket}/${key}?expires=${Date.now() + expiresIn * 1000}`;
  }
}
