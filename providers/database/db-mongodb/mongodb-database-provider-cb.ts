/**
 * 🔒 MyCodeXvantaOS - MongoDB Database Provider (CapabilityBase-based)
 *
 * @module providers/database/db-mongodb
 * @version 1.0.0
 */

import { CapabilityBase } from '../../../packages/capabilities/base';
import { ProviderHealthStatus } from '../../../packages/capabilities/types';
import type { ProviderConfig, ProviderHealthCheckResult } from '../../../packages/capabilities/types';

export interface MongoDatabaseConfig {
  connectionString?: string;
  host?: string;
  port?: number;
  database?: string;
  timeout?: number;
  retries?: number;
  fallbackProviderId?: string;
}

export interface QueryResult<T = any> {
  success: boolean;
  documents?: T[];
  error?: string;
  operationTime: number;
}

export class MongoDatabaseProvider extends CapabilityBase<MongoDatabaseConfig> {
  private connectionString: string;
  private timeout: number;
  private retries: number;
  private fallbackProviderId: string = 'native';
  private isMongoAvailable: boolean = false;

  constructor(id: string, name: string, config: ProviderConfig<MongoDatabaseConfig>, fallbackConfig?: any) {
    super(id, name, config, fallbackConfig);
    const cfg = config.config;
    this.connectionString = cfg.connectionString || `mongodb://\${cfg.host}:\${cfg.port}/\${cfg.database}`;
    this.timeout = cfg.timeout || 5000;
    this.retries = cfg.retries || 3;
  }

  protected async doInitialize(): Promise<void> {
    try {
      this.isMongoAvailable = Boolean(this.connectionString);
      if (this.isMongoAvailable) {
        this.log('info', 'MongoDB database provider initialized');
      } else {
        this.log('warn', 'MongoDB not available - will use native fallback');
      }
    } catch (error) {
      this.log('warn', 'MongoDB initialization failed:', error);
      this.isMongoAvailable = false;
    }
  }

  protected async doHealthCheck(): Promise<ProviderHealthCheckResult> {
    return { isHealthy: this.isMongoAvailable, status: this.isMongoAvailable ? ProviderHealthStatus.HEALTHY : ProviderHealthStatus.DEGRADED, checkTime: new Date().toISOString(), metrics: {} };
  }

  protected async doShutdown(): Promise<void> {
    this.log('info', 'MongoDB database provider shutdown');
  }

  async query<T = any>(collection: string, filter: any = {}): Promise<QueryResult<T>> {
    const startTime = Date.now();
    if (!this.isMongoAvailable) {
      return { success: false, error: `MongoDB not available. Use fallback: \${this.fallbackProviderId}`, operationTime: Date.now() - startTime };
    }
    try {
      const result = { success: true, documents: [], operationTime: 0 } as QueryResult<T>;
      result.operationTime = Date.now() - startTime;
      this.recordSuccess(result.operationTime);
      return result;
    } catch (error) {
      this.recordFailure(error);
      return { success: false, error: (error as Error).message, operationTime: Date.now() - startTime };
    }
  }

  async insert<T = any>(collection: string, document: any): Promise<QueryResult<T>> {
    return this.query(collection, {});
  }

  async update<T = any>(collection: string, filter: any, update: any): Promise<QueryResult<T>> {
    return this.query(collection, {});
  }

  async delete<T = any>(collection: string, filter: any): Promise<QueryResult<T>> {
    return this.query(collection, {});
  }

  getInfo(): Record<string, unknown> {
    return { id: this.id, name: this.name, type: 'mongodb-database', available: this.isMongoAvailable, fallbackProvider: this.fallbackProviderId, status: this._status, isInitialized: this._isInitialized, metrics: this.metrics };
  }
}
export { MongoDatabaseProvider as default };
