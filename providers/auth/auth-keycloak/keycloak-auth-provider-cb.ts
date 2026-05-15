/**
 * 🔧 MyCodeXvantaOS - KeycloakAuthProvider (CapabilityBase-based)
 *
 * @module providers/auth/auth-keycloak
 * @version 1.0.0
 */

import { CapabilityBase } from '../../../packages/capabilities/base';
import { ProviderHealthStatus } from '../../../packages/capabilities/types';
import type {
  ProviderConfig,
  ProviderHealthCheckResult,
} from '../../../packages/capabilities/types';

export interface KeycloakAuthConfig {
  serverUrl: string;
  realm?: string;
  clientId?: string;
  clientSecret?: string;
}

export interface AuthResult {
  success: boolean;
  token?: string;
  user?: Record<string, unknown>;
  error?: string;
  operationTime: number;
}

export class KeycloakAuthProvider extends CapabilityBase<KeycloakAuthConfig> {
  private serverUrl: string;
  private realm: string | undefined;
  private clientId: string | undefined;
  private clientSecret: string | undefined;
  private isAvailable: boolean = false;
  private fallbackProviderId: string = 'native';

  constructor(config: ProviderConfig<KeycloakAuthConfig>) {
    super(config);
    const cfg = config.config;
    this.serverUrl = cfg.serverUrl;
    this.realm = cfg.realm;
    this.clientId = cfg.clientId;
    this.clientSecret = cfg.clientSecret;
  }

  protected async doInitialize(): Promise<void> {
    try {
      this.isAvailable = true;
      this.log('info', 'KeycloakAuthProvider initialized');
    } catch (error) {
      this.log('warn', 'KeycloakAuthProvider initialization failed:', error);
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
    this.log('info', 'KeycloakAuthProvider shutdown');
  }

  async authenticate(username: string, password: string): Promise<AuthResult> {
    const startTime = Date.now();
    if (!this.isAvailable) {
      return {
        success: false,
        error: `KeycloakAuthProvider not available. Use fallback: ${this.fallbackProviderId || 'native'}`,
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
  async verifyToken(token: string): Promise<AuthResult> {
    const startTime = Date.now();
    if (!this.isAvailable) {
      return {
        success: false,
        error: `KeycloakAuthProvider not available. Use fallback: ${this.fallbackProviderId || 'native'}`,
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
  async refreshToken(token: string): Promise<AuthResult> {
    const startTime = Date.now();
    if (!this.isAvailable) {
      return {
        success: false,
        error: `KeycloakAuthProvider not available. Use fallback: ${this.fallbackProviderId || 'native'}`,
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
      type: 'keycloak-auth',
      available: this.isAvailable,
    };
  }
}
export { KeycloakAuthProvider as default };
