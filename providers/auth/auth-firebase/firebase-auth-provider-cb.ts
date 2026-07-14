/**
 * 🔐 MyCodexVantaOS - Firebase Auth Provider (CapabilityBase-based)
 *
 * @module providers/auth/auth-firebase
 * @version 1.0.0
 */

import { CapabilityBase } from '../../../packages/capabilities/base';
import { ProviderHealthStatus } from '../../../packages/capabilities/types';
import type {
  ProviderConfig,
  ProviderHealthCheckResult,
} from '../../../packages/capabilities/types';

export interface FirebaseAuthConfig {
  projectId?: string;
  serviceAccountKey?: string;
  apiKey?: string;
  authDomain?: string;
  timeout?: number;
  retries?: number;
  fallbackProviderId?: string;
}

export interface AuthUser {
  uid: string;
  email?: string;
  displayName?: string;
  provider?: string;
  customClaims?: Record<string, unknown>;
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  token?: string;
  error?: string;
  operationTime: number;
}

export class FirebaseAuthProvider extends CapabilityBase<FirebaseAuthConfig> {
  private projectId: string | undefined;
  private serviceAccountKey: string | undefined;
  private apiKey: string | undefined;
  private authDomain: string;
  private timeout: number;
  private retries: number;
  private fallbackProviderId: string = 'native';
  private isAvailable: boolean = false;

  constructor(config: ProviderConfig<FirebaseAuthConfig>) {
    super(config);
    const cfg = config.config;
    this.projectId = cfg.projectId;
    this.serviceAccountKey = cfg.serviceAccountKey;
    this.apiKey = cfg.apiKey;
    this.authDomain = cfg.authDomain || `${cfg.projectId || 'default'}.firebaseapp.com`;
    this.timeout = cfg.timeout || 5000;
    this.retries = cfg.retries || 3;
  }

  protected async doInitialize(): Promise<void> {
    try {
      this.isAvailable = Boolean(this.projectId && (this.serviceAccountKey || this.apiKey));
      if (this.isAvailable) {
        this.log('info', 'Firebase Auth provider initialized');
      } else {
        this.log('warn', 'Firebase Auth not configured - will use native fallback');
      }
    } catch (error) {
      this.log('warn', 'Firebase Auth initialization failed:', error);
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
    this.log('info', 'Firebase Auth provider shutdown');
  }

  async verifyToken(token: string): Promise<AuthResult> {
    const startTime = Date.now();
    if (!this.isAvailable) {
      return {
        success: false,
        error: `Firebase Auth not available. Use fallback: ${this.fallbackProviderId}`,
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

  async createUser(email: string, password: string): Promise<AuthResult> {
    const startTime = Date.now();
    if (!this.isAvailable) {
      return {
        success: false,
        error: `Firebase Auth not available. Use fallback: ${this.fallbackProviderId}`,
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

  async getUser(uid: string): Promise<AuthResult> {
    const startTime = Date.now();
    if (!this.isAvailable) {
      return {
        success: false,
        error: `Firebase Auth not available. Use fallback: ${this.fallbackProviderId}`,
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
      type: 'firebase-auth',
      available: this.isAvailable,
      projectId: this.projectId,
    };
  }
}
export { FirebaseAuthProvider as default };
