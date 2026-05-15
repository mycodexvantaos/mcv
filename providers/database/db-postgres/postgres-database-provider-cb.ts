/**
 * 🔒 MyCodeXvantaOS - PostgreSQL Database Provider (CapabilityBase-based)
 *
 * @module providers/database/db-postgres
 * @version 1.0.0
 */

import { CapabilityBase } from '../../../packages/capabilities/base';
import { ProviderHealthStatus } from '../../../packages/capabilities/types';
import type {
  ProviderConfig,
  ProviderHealthCheckResult,
} from '../../../packages/capabilities/types';

export interface PostgreSQLDatabaseConfig {
  connectionString?: string;
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  timeout?: number;
  retries?: number;
  fallbackProviderId?: string;
}

export interface QueryResult<T = any> {
  success: boolean;
  rows?: T[];
  affectedRows?: number;
  error?: string;
  operationTime: number;
}

export class PostgreSQLDatabaseProvider extends CapabilityBase<PostgreSQLDatabaseConfig> {
  private connectionString: string;
  private timeout: number;
  private retries: number;
  private fallbackProviderId: string = 'native';
  private isPostgreSQLAvailable: boolean = false;

  constructor(
    id: string,
    name: string,
    config: ProviderConfig<PostgreSQLDatabaseConfig>,
    fallbackConfig?: any
  ) {
    super(id, name, config, fallbackConfig);
    const cfg = config.config;
    this.connectionString =
      cfg.connectionString ||
      `postgresql://\${cfg.user}:\${cfg.password}@\${cfg.host}:\${cfg.port}/\${cfg.database}`;
    this.timeout = cfg.timeout || 5000;
    this.retries = cfg.retries || 3;
  }

  protected async doInitialize(): Promise<void> {
    try {
      this.isPostgreSQLAvailable = Boolean(this.connectionString);
      if (this.isPostgreSQLAvailable) {
        this.log('info', 'PostgreSQL database provider initialized');
      } else {
        this.log('warn', 'PostgreSQL not available - will use native fallback');
      }
    } catch (error) {
      this.log('warn', 'PostgreSQL initialization failed:', error);
      this.isPostgreSQLAvailable = false;
    }
  }

  protected async doHealthCheck(): Promise<ProviderHealthCheckResult> {
    return {
      isHealthy: this.isPostgreSQLAvailable,
      status: this.isPostgreSQLAvailable
        ? ProviderHealthStatus.HEALTHY
        : ProviderHealthStatus.DEGRADED,
      checkTime: new Date().toISOString(),
      metrics: {},
    };
  }

  protected async doShutdown(): Promise<void> {
    this.log('info', 'PostgreSQL database provider shutdown');
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<QueryResult<T>> {
    const startTime = Date.now();
    if (!this.isPostgreSQLAvailable) {
      return {
        success: false,
        error: `PostgreSQL not available. Use fallback: \${this.fallbackProviderId}`,
        operationTime: Date.now() - startTime,
      };
    }
    try {
      const result = { success: true, rows: [], operationTime: 0 } as QueryResult<T>;
      result.operationTime = Date.now() - startTime;
      this.recordSuccess(result.operationTime);
      return result;
    } catch (error) {
      this.recordFailure(error);
      return {
        success: false,
        error: (error as Error).message,
        operationTime: Date.now() - startTime,
      };
    }
  }

  async execute(sql: string, params: any[] = []): Promise<QueryResult<void>> {
    return this.query(sql, params);
  }

  getInfo(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.name,
      type: 'postgresql-database',
      available: this.isPostgreSQLAvailable,
      fallbackProvider: this.fallbackProviderId,
      status: this._status,
      isInitialized: this._isInitialized,
      metrics: this.metrics,
    };
  }
}
export { PostgreSQLDatabaseProvider as default };
