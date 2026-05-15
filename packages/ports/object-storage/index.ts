/**
 * MyCodeXvantaOS — Object Storage Port
 * Abstracts blob/object storage operations.
 *
 * Cloudflare implementation: R2
 * Portable alternatives: S3, MinIO, local-fs, GCS
 *
 * Dependency: depends on @mycodexvantaos/core types only.
 */

// ── Object Storage Port Interface ──────────────────────────────────────

export interface IObjectStoragePort {
  /** Store a blob and return its key */
  put(bucket: string, key: string, data: Uint8Array, options?: StoragePutOptions): Promise<StoragePutResult>;

  /** Retrieve a blob by key */
  get(bucket: string, key: string): Promise<Uint8Array | null>;

  /** Delete a blob by key */
  delete(bucket: string, key: string): Promise<void>;

  /** Check if a blob exists */
  exists(bucket: string, key: string): Promise<boolean>;

  /** Get metadata for a blob */
  getMetadata(bucket: string, key: string): Promise<StorageMetadata | null>;

  /** List blobs with optional prefix filter */
  list(bucket: string, options?: StorageListOptions): Promise<StorageListResult>;

  /** Generate a presigned URL for temporary access */
  getPresignedUrl(bucket: string, key: string, expiresIn: number): Promise<string>;
}

// ── Supporting Types ───────────────────────────────────────────────────

export interface StoragePutOptions {
  contentType?: string;
  metadata?: Record<string, string>;
  cacheControl?: string;
}

export interface StoragePutResult {
  key: string;
  etag: string;
  sizeBytes: number;
}

export interface StorageMetadata {
  key: string;
  sizeBytes: number;
  contentType: string;
  lastModified: string;
  etag: string;
  customMetadata: Record<string, string>;
}

export interface StorageListOptions {
  prefix?: string;
  limit?: number;
  cursor?: string;
}

export interface StorageListResult {
  keys: string[];
  cursor?: string;
  truncated: boolean;
}
