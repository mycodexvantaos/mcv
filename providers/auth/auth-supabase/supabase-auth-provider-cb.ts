/**
 * 🔐 MyCodexVantaOS - Supabase Auth Provider (CapabilityBase-based)
 *
 * @module providers/auth/auth-supabase
 * @version 1.0.0
 */

import { CapabilityBase } from '../../../packages/capabilities/base';
import { ProviderHealthStatus } from '../../../packages/capabilities/types';
import type {
  ProviderConfig,
  ProviderHealthCheckResult,
} from '../../../packages/capabilities/types';

export interface SupabaseAuthConfig {
  url?: string;
  anonKey?: string;
  serviceRoleKey?: string;
  timeout?: number;
  retries?: number;
  fallbackProviderId?: string;
}

export interface AuthUser {
  id: string;
  email?: string;
  role?: string;
  metadata?: Record<string, unknown>;
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  token?: string;
  error?: string;
  operationTime: number;
}

export class SupabaseAuthProvider extends CapabilityBase<SupabaseAuthConfig> {
  private url: string;
  private anonKey: string | undefined;
  private serviceRoleKey: string | undefined;
  private timeout: number;
  private retries: number;
  private fallbackProviderId: string = 'native';
  private isAvailable: boolean = false;

  constructor(config: ProviderConfig<SupabaseAuthConfig>) {
    super(config);
    const cfg = config.config;
    this.url = cfg.url || 'https://localhost:54321';
    this.anonKey = cfg.anonKey;
    this.serviceRoleKey = cfg.serviceRoleKey;
    this.timeout = cfg.timeout || 5000;
    this.retries = cfg.retries || 3;
  }

  protected async doInitialize(): Promise<void> {
    try {
      this.isAvailable = Boolean(this.url && this.anonKey);
      if (this.isAvailable) {
        this.log('info', 'Supabase Auth provider initialized');
      } else {
        this.log('warn', 'Supabase Auth not configured - will use native fallback');
      }
    } catch (error) {
      this.log('warn', 'Supabase Auth initialization failed:', error);
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
    this.log('info', 'Supabase Auth provider shutdown');
  }

  async signIn(email: string, password: string): Promise<AuthResult> {
    const startTime = Date.now();
    if (!this.isAvailable) {
      return {
        success: false,
        error: `Supabase Auth not available. Use fallback: ${this.fallbackProviderId}`,
        operationTime: Date.now() - startTime,
      };
    }
    try {
      const result: AuthResult = { success: true, operationTime: Date.now() - startTime };
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

  async signUp(email: string, password: string): Promise<AuthResult> {
    const startTime = Date.now();
    if (!this.isAvailable) {
      return {
        success: false,
        error: `Supabase Auth not available. Use fallback: ${this.fallbackProviderId}`,
        operationTime: Date.now() - startTime,
      };
    }
    try {
      const result: AuthResult = { success: true, operationTime: Date.now() - startTime };
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

  async verifyToken(token: string): Promise<AuthResult> {
    const startTime = Date.now();
    if (!this.isAvailable) {
      return {
        success: false,
        error: `Supabase Auth not available. Use fallback: ${this.fallbackProviderId}`,
        operationTime: Date.now() - startTime,
      };
    }
    try {
      const result: AuthResult = { success: true, operationTime: Date.now() - startTime };
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

  getInfo(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.name,
      type: 'supabase-auth',
      available: this.isAvailable,
      url: this.url,
    };
  }
}
export { SupabaseAuthProvider as default };
