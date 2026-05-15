/**
 * 🔒 MyCodeXvantaOS - Memory Storage Provider (CapabilityBase-based)
 *
 * In-memory storage implementation with zero external dependencies.
 *
 * @module providers/storage/storage-memory
 * @version 1.0.0
 */

import { CapabilityBase } from '../../../packages/capabilities/base';
import type { ProviderConfig, ProviderHealthCheckResult, ProviderHealthStatus } from '../../../packages/capabilities/types';

/**
 * Configuration for Memory Storage Provider
 */
export interface MemoryStorageConfig {
  /** Maximum storage size in bytes */
  maxSize?: number;
  
  /** Maximum number of files */
  maxFiles?: number;
  
  /** Enable automatic cleanup */
  autoCleanup?: boolean;
  
  /** Native fallback provider ID */
  fallbackProviderId?: string;
}

/**
 * File metadata
 */
export interface FileMetadata {
  /** File name */
  name: string;
  
  /** File path */
  path: string;
  
  /** File size in bytes */
  size: number;
  
  /** Content type */
  contentType?: string;
  
  /** Creation timestamp */
  createdAt: number;
  
  /** Last modified timestamp */
  lastModified: number;
  
  /** Custom metadata */
  metadata?: Record<string, string>;
}

/**
 * Stored file
 */
export interface StoredFile {
  /** File data (base64 or buffer) */
  data: string;
  
  /** File metadata */
  metadata: FileMetadata;
}

/**
 * Upload result
 */
export interface UploadResult {
  /** Success status */
  success: boolean;
  
  /** File path */
  path?: string;
  
  /** File size */
  size?: number;
  
  /** Error message */
  error?: string;
  
  /** Operation time in milliseconds */
  operationTime: number;
}

/**
 * Download result
 */
export interface DownloadResult {
  /** Success status */
  success: boolean;
  
  /** File data */
  data?: string;
  
  /** File metadata */
  metadata?: FileMetadata;
  
  /** Error message */
  error?: string;
  
  /** Operation time in milliseconds */
  operationTime: number;
}

/**
 * List result
 */
export interface ListResult {
  /** Success status */
  success: boolean;
  
  /** Files */
  files?: FileMetadata[];
  
  /** Total count */
  count?: number;
  
  /** Error message */
  error?: string;
  
  /** Operation time in milliseconds */
  operationTime: number;
}

/**
 * Delete result
 */
export interface DeleteResult {
  /** Success status */
  success: boolean;
  
  /** Deleted paths */
  paths?: string[];
  
  /** Error message */
  error?: string;
  
  /** Operation time in milliseconds */
  operationTime: number;
}

/**
 * 🔒 Memory Storage Provider
 *
 * Native in-memory storage with zero external dependencies.
 */
export class MemoryStorageProvider extends CapabilityBase<MemoryStorageConfig> {
  private storage: Map<string, StoredFile>;
  private maxSize: number;
  private maxFiles: number;
  private currentSize: number;
  private autoCleanup: boolean;
  private fallbackProviderId: string;

  constructor(config: ProviderConfig<MemoryStorageConfig>) {
    super(config);
    this.storage = new Map();
    this.maxSize = config.config.maxSize || 100 * 1024 * 1024; // 100MB default
    this.maxFiles = config.config.maxFiles || 1000;
    this.currentSize = 0;
    this.autoCleanup = config.config.autoCleanup ?? false;
    this.fallbackProviderId = config.config.fallbackProviderId || '';
  }

  /**
   * Initialize provider
   */
  protected async doInitialize(): Promise<void> {
    this.log('info', 'Memory storage provider initialized');
    this.log('debug', `Max size: ${this.maxSize} bytes, Max files: ${this.maxFiles}`);
  }

  /**
   * Health check
   */
  protected async doHealthCheck(): Promise<ProviderHealthCheckResult> {
    try {
      const isHealthy = this.currentSize < this.maxSize && 
                       this.storage.size < this.maxFiles;
      
      return {
        isHealthy,
        status: isHealthy ? ProviderHealthStatus.HEALTHY : ProviderHealthStatus.DEGRADED,
        checkTime: new Date().toISOString(),
        metrics: {
          currentSize: this.currentSize,
          maxFiles: this.storage.size,
          maxFiles: this.maxFiles,
          maxSize: this.maxSize,
        },
      };
    } catch (error) {
      return {
        isHealthy: false,
        status: ProviderHealthStatus.UNHEALTHY,
        checkTime: new Date().toISOString(),
        metrics: {
          lastError: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Shutdown provider
   */
  protected async doShutdown(): Promise<void> {
    this.storage.clear();
    this.currentSize = 0;
    this.log('info', 'Memory storage provider shutdown cleared all data');
  }

  /**
   * Upload file
   */
  async upload(
    path: string,
    data: string,
    options?: {
      contentType?: string;
      metadata?: Record<string, string>;
    }
  ): Promise<UploadResult> {
    const startTime = Date.now();
    
    try {
      const size = data.length;
      
      // Check limits
      if (this.currentSize + size > this.maxSize) {
        // Auto cleanup if enabled
        if (this.autoCleanup) {
          await this.cleanupSpace(size);
        } else {
          return {
            success: false,
            error: 'Storage size limit reached',
            operationTime: Date.now() - startTime,
          };
        }
      }
      
      if (this.storage.size >= this.maxFiles && !this.storage.has(path)) {
        return {
          success: false,
          error: 'File count limit reached',
          operationTime: Date.now() - startTime,
        };
      }
      
      // Store file
      const fileMetadata: FileMetadata = {
        name: path.split('/').pop() || path,
        path,
        size,
        contentType: options?.contentType,
        createdAt: Date.now(),
        lastModified: Date.now(),
        metadata: options?.metadata,
      };
      
      const storedFile: StoredFile = {
        data,
        metadata: fileMetadata,
      };
      
      this.storage.set(path, storedFile);
      this.currentSize += size;
      
      this.log('info', `Uploaded file: ${path} (${size} bytes)`);
      this.recordMetric('upload', size);
      
      return {
        success: true,
        path,
        size,
        operationTime: Date.now() - startTime,
      };
    } catch (error) {
      this.recordMetric('upload_error', 1);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
        operationTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Download file
   */
  async download(path: string): Promise<DownloadResult> {
    const startTime = Date.now();
    
    try {
      const file = this.storage.get(path);
      
      if (!file) {
        return {
          success: false,
          error: 'File not found',
          operationTime: Date.now() - startTime,
        };
      }
      
      // Update last accessed time
      file.metadata.lastModified = Date.now();
      
      this.log('info', `Downloaded file: ${path}`);
      this.recordMetric('download', file.metadata.size);
      
      return {
        success: true,
        data: file.data,
        metadata: file.metadata,
        operationTime: Date.now() - startTime,
      };
    } catch (error) {
      this.recordMetric('download_error', 1);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Download failed',
        operationTime: Date.now() - startTime,
      };
    }
  }

  /**
   * List files
   */
  async list(prefix?: string): Promise<ListResult> {
    const startTime = Date.now();
    
    try {
      let files: FileMetadata[] = [];
      
      this.storage.forEach((file) => {
        if (!prefix || file.metadata.path.startsWith(prefix)) {
          files.push(file.metadata);
        }
      });
      
      // Sort by path
      files.sort((a, b) => a.path.localeCompare(b.path));
      
      this.log('info', `Listed ${files.length} files`);
      
      return {
        success: true,
        files,
        count: files.length,
        operationTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'List failed',
        operationTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Delete file
   */
  async delete(path: string): Promise<DeleteResult> {
    const startTime = Date.now();
    
    try {
      const file = this.storage.get(path);
      
      if (!file) {
        return {
          success: false,
          error: 'File not found',
          operationTime: Date.now() - startTime,
        };
      }
      
      this.currentSize -= file.metadata.size;
      this.storage.delete(path);
      
      this.log('info', `Deleted file: ${path}`);
      this.recordMetric('delete', 1);
      
      return {
        success: true,
        paths: [path],
        operationTime: Date.now() - startTime,
      };
    } catch (error) {
      this.recordMetric('delete_error', 1);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Delete failed',
        operationTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Delete multiple files
   */
  async deleteMany(paths: string[]): Promise<DeleteResult> {
    const startTime = Date.now();
    const deletedPaths: string[] = [];
    
    try {
      for (const path of paths) {
        const file = this.storage.get(path);
        if (file) {
          this.currentSize -= file.metadata.size;
          this.storage.delete(path);
          deletedPaths.push(path);
        }
      }
      
      this.log('info', `Deleted ${deletedPaths.length} files`);
      this.recordMetric('delete_batch', deletedPaths.length);
      
      return {
        success: true,
        paths: deletedPaths,
        operationTime: Date.now() - startTime,
      };
    } catch (error) {
      this.recordMetric('delete_error', 1);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Delete failed',
        operationTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Cleanup space
   */
  private async cleanupSpace(requiredSpace: number): Promise<void> {
    // Delete oldest files first
    const files = Array.from(this.storage.entries())
      .sort((a, b) => a[1].metadata.createdAt - b[1].metadata.createdAt);
    
    let freedSpace = 0;
    
    for (const [path, file] of files) {
      if (freedSpace >= requiredSpace) break;
      
      this.currentSize -= file.metadata.size;
      this.storage.delete(path);
      freedSpace += file.metadata.size;
    }
    
    this.log('info', `Cleaned up ${freedSpace} bytes`);
  }

  /**
   * Get provider info
   */
  getInfo(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.name,
      type: 'memory-storage',
      totalFiles: this.storage.size,
      currentSize: this.currentSize,
      maxSize: this.maxSize,
      maxFiles: this.maxFiles,
      autoCleanup: this.autoCleanup,
      fallbackProvider: this.fallbackProviderId,
      status: this._status,
      isInitialized: this._isInitialized,
      metrics: this.metrics,
    };
  }
}

/**
 * Default export
 */
export { MemoryStorageProvider as default };
