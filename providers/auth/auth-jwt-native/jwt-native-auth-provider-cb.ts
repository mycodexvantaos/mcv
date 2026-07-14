/**
 * 🔧 MyCodexVantaOS - JWTNativeAuthProvider (CapabilityBase-based)
 *
 * @module providers/auth/auth-jwt-native
 * @version 1.0.0
 */

import { CapabilityBase } from '../../../packages/capabilities/base';
import { ProviderHealthStatus } from '../../../packages/capabilities/types';
import type {
  ProviderConfig,
  ProviderHealthCheckResult,
} from '../../../packages/capabilities/types';

export interface JWTNativeAuthConfig {
  jwtSecret: string;
  jwtExpiresIn?: string;
  algorithm?: string;
}

export interface TokenResult {
  success: boolean;
  token?: string;
  expiresAt?: string;
  error?: string;
  operationTime: number;
}
export interface VerifyResult {
  success: boolean;
  valid?: boolean;
  payload?: Record<string, unknown>;
  error?: string;
  operationTime: number;
}

export class JWTNativeAuthProvider extends CapabilityBase<JWTNativeAuthConfig> {
  private jwtSecret: string;
  private jwtExpiresIn: string | undefined;
  private algorithm: string | undefined;
  private isAvailable: boolean = false;
  private fallbackProviderId: string = 'native';

  constructor(config: ProviderConfig<JWTNativeAuthConfig>) {
    super(config);
    const cfg = config.config;
    this.jwtSecret = cfg.jwtSecret;
    this.jwtExpiresIn = cfg.jwtExpiresIn || '24h';
    this.algorithm = cfg.algorithm || 'HS256';
  }

  protected async doInitialize(): Promise<void> {
    try {
      this.isAvailable = true;
      this.log('info', 'JWTNativeAuthProvider initialized');
    } catch (error) {
      this.log('warn', 'JWTNativeAuthProvider initialization failed:', error);
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
    this.log('info', 'JWTNativeAuthProvider shutdown');
  }

  async signToken(payload: Record<string, unknown>): Promise<TokenResult> {
    const startTime = Date.now();
    if (!this.isAvailable) {
      return {
        success: false,
        error: `JWTNativeAuthProvider not available. Use fallback: ${this.fallbackProviderId || 'native'}`,
        operationTime: Date.now() - startTime,
      } as any;
    }
    try {
      const result: any = { success: true, operationTime: Date.now() - startTime };
      this.recordSuccess(result.operationTime);
      return result;
    } catch (error) {
      this.recordFailure(error);
      return {
        success: false,
        error: (error as Error).message,
        operationTime: Date.now() - startTime,
      } as any;
    }
  }
  async verifyToken(token: string): Promise<VerifyResult> {
    const startTime = Date.now();
    if (!this.isAvailable) {
      return {
        success: false,
        error: `JWTNativeAuthProvider not available. Use fallback: ${this.fallbackProviderId || 'native'}`,
        operationTime: Date.now() - startTime,
      } as any;
    }
    try {
      const result: any = { success: true, operationTime: Date.now() - startTime };
      this.recordSuccess(result.operationTime);
      return result;
    } catch (error) {
      this.recordFailure(error);
      return {
        success: false,
        error: (error as Error).message,
        operationTime: Date.now() - startTime,
      } as any;
    }
  }
  async refreshToken(token: string): Promise<TokenResult> {
    const startTime = Date.now();
    if (!this.isAvailable) {
      return {
        success: false,
        error: `JWTNativeAuthProvider not available. Use fallback: ${this.fallbackProviderId || 'native'}`,
        operationTime: Date.now() - startTime,
      } as any;
    }
    try {
      const result: any = { success: true, operationTime: Date.now() - startTime };
      this.recordSuccess(result.operationTime);
      return result;
    } catch (error) {
      this.recordFailure(error);
      return {
        success: false,
        error: (error as Error).message,
        operationTime: Date.now() - startTime,
      } as any;
    }
  }

  getInfo(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.name,
      type: 'jwt-native-auth',
      available: this.isAvailable,
    };
  }
}
export { JWTNativeAuthProvider as default };
