/**
 * 🔧 MyCodeXvantaOS - GitHubRepoProvider (CapabilityBase-based)
 *
 * @module providers/repo/repo-github
 * @version 1.0.0
 */

import { CapabilityBase } from '../../../packages/capabilities/base';
import { ProviderHealthStatus } from '../../../packages/capabilities/types';
import type {
  ProviderConfig,
  ProviderHealthCheckResult,
} from '../../../packages/capabilities/types';

export interface GitHubRepoConfig {
  token: string;
  org?: string;
  apiBaseUrl?: string;
}

export interface RepoResult {
  success: boolean;
  data?: unknown;
  error?: string;
  operationTime: number;
}

export class GitHubRepoProvider extends CapabilityBase<GitHubRepoConfig> {
  private token: string;
  private org: string | undefined;
  private apiBaseUrl: string | undefined;
  private isAvailable: boolean = false;
  private fallbackProviderId: string = 'native';

  constructor(config: ProviderConfig<GitHubRepoConfig>) {
    super(config);
    const cfg = config.config;
    this.token = cfg.token;
    this.org = cfg.org || 'mycodexvantaos';
    this.apiBaseUrl = cfg.apiBaseUrl || 'https://api.github.com';
  }

  protected async doInitialize(): Promise<void> {
    try {
      this.isAvailable = true;
      this.log('info', 'GitHubRepoProvider initialized');
    } catch (error) {
      this.log('warn', 'GitHubRepoProvider initialization failed:', error);
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
    this.log('info', 'GitHubRepoProvider shutdown');
  }

  async getRepo(owner: string, repo: string): Promise<RepoResult> {
    const startTime = Date.now();
    if (!this.isAvailable) {
      return {
        success: false,
        error: `GitHubRepoProvider not available. Use fallback: ${this.fallbackProviderId || 'native'}`,
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
  async createIssue(owner: string, repo: string, title: string, body: string): Promise<RepoResult> {
    const startTime = Date.now();
    if (!this.isAvailable) {
      return {
        success: false,
        error: `GitHubRepoProvider not available. Use fallback: ${this.fallbackProviderId || 'native'}`,
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
  async listCommits(owner: string, repo: string): Promise<RepoResult> {
    const startTime = Date.now();
    if (!this.isAvailable) {
      return {
        success: false,
        error: `GitHubRepoProvider not available. Use fallback: ${this.fallbackProviderId || 'native'}`,
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
      type: 'github-repo',
      available: this.isAvailable,
    };
  }
}
export { GitHubRepoProvider as default };
