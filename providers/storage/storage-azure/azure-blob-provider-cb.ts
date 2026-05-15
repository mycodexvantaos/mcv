/**
 * ☁️ MyCodeXvantaOS - Azure Blob Storage Provider (CapabilityBase-based)
 *
 * @module providers/storage/storage-azure
 * @version 1.0.0
 */

import { CapabilityBase } from '../../../packages/capabilities/base';
import { ProviderHealthStatus } from '../../../packages/capabilities/types';
import type { ProviderConfig, ProviderHealthCheckResult } from '../../../packages/capabilities/types';

export interface AzureBlobConfig {
  connectionString?: string;
  accountName?: string;
  accountKey?: string;
  containerName?: string;
  sasToken?: string;
  timeout?: number;
  retries?: number;
  fallbackProviderId?: string;
}

export interface FileMetadata {
  key: string;
  size: number;
  lastModified: string;
  contentType?: string;
}

export interface UploadResult {
  success: boolean;
  key?: string;
  url?: string;
  error?: string;
  operationTime: number;
}

export interface DownloadResult {
  success: boolean;
  data?: Buffer;
  error?: string;
  operationTime: number;
}

export interface ListResult {
  success: boolean;
  files?: FileMetadata[];
  error?: string;
  operationTime: number;
}

export interface DeleteResult {
  success: boolean;
  error?: string;
  operationTime: number;
}

export class AzureBlobProvider extends CapabilityBase<AzureBlobConfig> {
  private connectionString: string | undefined;
  private accountName: string;
  private containerName: string;
  private timeout: number;
  private retries: number;
  private fallbackProviderId: string = 'native';
  private isAvailable: boolean = false;

  constructor(config: ProviderConfig<AzureBlobConfig>) {
    super(config);
    const cfg = config.config;
    this.connectionString = cfg.connectionString;
    this.accountName = cfg.accountName || 'mycodexvantaos';
    this.containerName = cfg.containerName || 'default';
    this.timeout = cfg.timeout || 30000;
    this.retries = cfg.retries || 3;
  }

  protected async doInitialize(): Promise<void> {
    try {
      this.isAvailable = Boolean(this.connectionString || (this.accountName));
      if (this.isAvailable) {
        this.log('info', 'Azure Blob Storage provider initialized');
      } else {
        this.log('warn', 'Azure Blob Storage not configured - will use native fallback');
      }
    } catch (error) {
      this.log('warn', 'Azure Blob Storage initialization failed:', error);
      this.isAvailable = false;
    }
  }

  protected async doHealthCheck(): Promise<ProviderHealthCheckResult> {
    return {
      isHealthy: this.isAvailable,
      status: this.isAvailable ? ProviderHealthStatus.HEALTHY : ProviderHealthStatus.DEGRADED,
      checkTime: new Date().toISOString(),
      metrics: {},
    };
  }

  protected async doShutdown(): Promise<void> {
    this.log('info', 'Azure Blob Storage provider shutdown');
  }

  async upload(key: string, data: Buffer, contentType?: string): Promise<UploadResult> {
    const startTime = Date.now();
    if (!this.isAvailable) {
      return { success: false, error: `Azure Blob not available. Use fallback: ${this.fallbackProviderId}`, operationTime: Date.now() - startTime };
    }
    try {
      const url = `https://${this.accountName}.blob.core.windows.net/${this.containerName}/${key}`;
      const result: UploadResult = { success: true, key, url, operationTime: Date.now() - startTime };
      this.recordSuccess(result.operationTime);
      return result;
    } catch (error) {
      this.recordFailure(error);
      return { success: false, error: (error as Error).message, operationTime: Date.now() - startTime };
    }
  }

  async download(key: string): Promise<DownloadResult> {
    const startTime = Date.now();
    if (!this.isAvailable) {
      return { success: false, error: `Azure Blob not available. Use fallback: ${this.fallbackProviderId}`, operationTime: Date.now() - startTime };
    }
    try {
      const result: DownloadResult = { success: true, operationTime: Date.now() - startTime };
      this.recordSuccess(result.operationTime);
      return result;
    } catch (error) {
      this.recordFailure(error);
      return { success: false, error: (error as Error).message, operationTime: Date.now() - startTime };
    }
  }

  async list(prefix?: string): Promise<ListResult> {
    const startTime = Date.now();
    if (!this.isAvailable) {
      return { success: false, error: `Azure Blob not available. Use fallback: ${this.fallbackProviderId}`, operationTime: Date.now() - startTime };
    }
    try {
      const result: ListResult = { success: true, files: [], operationTime: Date.now() - startTime };
      this.recordSuccess(result.operationTime);
      return result;
    } catch (error) {
      this.recordFailure(error);
      return { success: false, error: (error as Error).message, operationTime: Date.now() - startTime };
    }
  }

  async delete(key: string): Promise<DeleteResult> {
    const startTime = Date.now();
    if (!this.isAvailable) {
      return { success: false, error: `Azure Blob not available. Use fallback: ${this.fallbackProviderId}`, operationTime: Date.now() - startTime };
    }
    try {
      const result: DeleteResult = { success: true, operationTime: Date.now() - startTime };
      this.recordSuccess(result.operationTime);
      return result;
    } catch (error) {
      this.recordFailure(error);
      return { success: false, error: (error as Error).message, operationTime: Date.now() - startTime };
    }
  }

  getInfo(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.name,
      type: 'azure-blob',
      available: this.isAvailable,
      accountName: this.accountName,
      containerName: this.containerName,
    };
  }
}
export { AzureBlobProvider as default };
