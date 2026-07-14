/**
 * MyCodexVantaOS S3 Connector
 * Provides integration with S3-compatible storage services
 */

export interface S3Config {
  accessKeyId: string;
  secretAccessKey: string;
  region?: string;
  endpoint?: string;
  bucket?: string;
  timeout?: number;
}

export interface S3Object {
  key: string;
  size?: number;
  lastModified?: Date;
  etag?: string;
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface S3UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
  acl?: 'private' | 'public-read' | 'public-read-write' | 'authenticated-read';
}

export interface S3DownloadOptions {
  range?: { start: number; end: number };
}

export interface S3ListOptions {
  prefix?: string;
  delimiter?: string;
  maxKeys?: number;
  marker?: string;
}

export class S3Connector {
  private config: Required<Omit<S3Config, 'bucket'>> & { bucket?: string };
  private connected: boolean = false;
  private storage: Map<string, Map<string, { data: Buffer; metadata: any }>> = new Map();

  constructor(config: S3Config) {
    this.config = {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
      region: config.region || 'us-east-1',
      endpoint: config.endpoint || 'https://s3.amazonaws.com',
      bucket: config.bucket,
      timeout: config.timeout || 30000,
    };
  }

  /**
   * Connect to S3
   */
  async connect(): Promise<void> {
    // Simulate connection
    await new Promise((resolve) => setTimeout(resolve, 10));
    this.connected = true;
  }

  /**
   * Disconnect from S3
   */
  async disconnect(): Promise<void> {
    this.connected = false;
    this.storage.clear();
  }

  /**
   * Check connection status
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Get or create bucket storage
   */
  private getBucket(bucket: string): Map<string, { data: Buffer; metadata: any }> {
    if (!this.storage.has(bucket)) {
      this.storage.set(bucket, new Map());
    }
    return this.storage.get(bucket)!;
  }

  /**
   * Upload object to S3
   */
  async upload(
    bucket: string,
    key: string,
    data: Buffer | string,
    options?: S3UploadOptions
  ): Promise<S3Object> {
    if (!this.connected) {
      throw new Error('Not connected to S3');
    }

    const buffer = typeof data === 'string' ? Buffer.from(data) : data;
    const bucketStorage = this.getBucket(bucket);

    const object: S3Object = {
      key,
      size: buffer.length,
      lastModified: new Date(),
      etag: this.generateETag(buffer),
      contentType: options?.contentType || 'application/octet-stream',
      metadata: options?.metadata || {},
    };

    bucketStorage.set(key, {
      data: buffer,
      metadata: object,
    });

    return object;
  }

  /**
   * Download object from S3
   */
  async download(bucket: string, key: string, options?: S3DownloadOptions): Promise<Buffer> {
    if (!this.connected) {
      throw new Error('Not connected to S3');
    }

    const bucketStorage = this.getBucket(bucket);
    const object = bucketStorage.get(key);

    if (!object) {
      throw new Error(`Object '${key}' not found in bucket '${bucket}'`);
    }

    let data = object.data;

    // Handle range requests
    if (options?.range) {
      const { start, end } = options.range;
      data = data.slice(start, end + 1);
    }

    return data;
  }

  /**
   * Delete object from S3
   */
  async delete(bucket: string, key: string): Promise<void> {
    if (!this.connected) {
      throw new Error('Not connected to S3');
    }

    const bucketStorage = this.getBucket(bucket);
    const deleted = bucketStorage.delete(key);

    if (!deleted) {
      throw new Error(`Object '${key}' not found in bucket '${bucket}'`);
    }
  }

  /**
   * Check if object exists
   */
  async exists(bucket: string, key: string): Promise<boolean> {
    if (!this.connected) {
      return false;
    }

    const bucketStorage = this.getBucket(bucket);
    return bucketStorage.has(key);
  }

  /**
   * Get object metadata
   */
  async head(bucket: string, key: string): Promise<S3Object> {
    if (!this.connected) {
      throw new Error('Not connected to S3');
    }

    const bucketStorage = this.getBucket(bucket);
    const object = bucketStorage.get(key);

    if (!object) {
      throw new Error(`Object '${key}' not found in bucket '${bucket}'`);
    }

    return object.metadata;
  }

  /**
   * List objects in bucket
   */
  async list(bucket: string, options?: S3ListOptions): Promise<S3Object[]> {
    if (!this.connected) {
      throw new Error('Not connected to S3');
    }

    const bucketStorage = this.getBucket(bucket);
    let objects: S3Object[] = [];

    for (const [key, value] of bucketStorage.entries()) {
      // Apply prefix filter
      if (options?.prefix && !key.startsWith(options.prefix)) {
        continue;
      }

      objects.push(value.metadata);
    }

    // Sort by key
    objects.sort((a, b) => a.key.localeCompare(b.key));

    // Apply max keys limit
    if (options?.maxKeys) {
      objects = objects.slice(0, options.maxKeys);
    }

    return objects;
  }

  /**
   * Copy object within bucket or between buckets
   */
  async copy(
    sourceBucket: string,
    sourceKey: string,
    destBucket: string,
    destKey: string
  ): Promise<S3Object> {
    if (!this.connected) {
      throw new Error('Not connected to S3');
    }

    const sourceStorage = this.getBucket(sourceBucket);
    const sourceObject = sourceStorage.get(sourceKey);

    if (!sourceObject) {
      throw new Error(`Source object '${sourceKey}' not found`);
    }

    const destStorage = this.getBucket(destBucket);

    const metadata: S3Object = {
      key: destKey,
      size: sourceObject.data.length,
      lastModified: new Date(),
      etag: this.generateETag(sourceObject.data),
      contentType: sourceObject.metadata.contentType,
      metadata: { ...sourceObject.metadata.metadata },
    };

    destStorage.set(destKey, {
      data: Buffer.from(sourceObject.data),
      metadata,
    });

    return metadata;
  }

  /**
   * Generate presigned URL for object
   */
  async generatePresignedUrl(
    bucket: string,
    key: string,
    expiresIn: number = 3600
  ): Promise<string> {
    if (!this.connected) {
      throw new Error('Not connected to S3');
    }

    const bucketStorage = this.getBucket(bucket);
    if (!bucketStorage.has(key)) {
      throw new Error(`Object '${key}' not found`);
    }

    // Generate mock presigned URL
    const expires = Date.now() + expiresIn * 1000;
    return `${this.config.endpoint}/${bucket}/${key}?X-Amz-Expires=${expiresIn}&X-Amz-Date=${expires}`;
  }

  /**
   * Create bucket
   */
  async createBucket(bucket: string): Promise<void> {
    if (!this.connected) {
      throw new Error('Not connected to S3');
    }

    if (this.storage.has(bucket)) {
      throw new Error(`Bucket '${bucket}' already exists`);
    }

    this.storage.set(bucket, new Map());
  }

  /**
   * Delete bucket
   */
  async deleteBucket(bucket: string): Promise<void> {
    if (!this.connected) {
      throw new Error('Not connected to S3');
    }

    const deleted = this.storage.delete(bucket);

    if (!deleted) {
      throw new Error(`Bucket '${bucket}' not found`);
    }
  }

  /**
   * List buckets
   */
  async listBuckets(): Promise<string[]> {
    if (!this.connected) {
      throw new Error('Not connected to S3');
    }

    return Array.from(this.storage.keys());
  }

  /**
   * Get bucket info
   */
  async getBucketInfo(
    bucket: string
  ): Promise<{ name: string; objectCount: number; size: number }> {
    if (!this.connected) {
      throw new Error('Not connected to S3');
    }

    const bucketStorage = this.getBucket(bucket);
    let objectCount = 0;
    let totalSize = 0;

    for (const object of bucketStorage.values()) {
      objectCount++;
      totalSize += object.data.length;
    }

    return {
      name: bucket,
      objectCount,
      size: totalSize,
    };
  }

  /**
   * Delete multiple objects
   */
  async deleteMultiple(bucket: string, keys: string[]): Promise<number> {
    if (!this.connected) {
      throw new Error('Not connected to S3');
    }

    const bucketStorage = this.getBucket(bucket);
    let deletedCount = 0;

    for (const key of keys) {
      if (bucketStorage.delete(key)) {
        deletedCount++;
      }
    }

    return deletedCount;
  }

  /**
   * Empty bucket
   */
  async emptyBucket(bucket: string): Promise<number> {
    if (!this.connected) {
      throw new Error('Not connected to S3');
    }

    const bucketStorage = this.getBucket(bucket);
    const count = bucketStorage.size;
    bucketStorage.clear();

    return count;
  }

  /**
   * Generate ETag for buffer
   */
  private generateETag(buffer: Buffer): string {
    const crypto = require('crypto');
    const hash = crypto.createHash('md5').update(buffer).digest('hex');
    return `"${hash}"`;
  }
}

export default S3Connector;
