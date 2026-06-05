/**
 * @mycodexvantaos/semantic-core-client
 * TypeScript/Node.js Client for Semantic Core
 * 
 * Provides async client for decision-making with vector analysis,
 * parametric optimization, and feedback loops.
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { Logger } from 'pino';
import {
  DecisionContext,
  Evidence,
  DecisionParameters,
  Decision,
  EvidenceCluster,
  SemanticCoreClientConfig,
} from './types';
import {
  SemanticCoreError,
  ValidationError,
  AuthenticationError,
  ForbiddenError,
  NotFoundError,
  RateLimitError,
  ServerError,
  NetworkError,
} from './errors';
import { generateRequestId, createDefaultLogger } from './utils/logger';

/**
 * TypeScript Client for Semantic Core
 */
export class SemanticCoreClient {
  private client: AxiosInstance;
  private logger: Logger;
  private config: SemanticCoreClientConfig;

  constructor(config: SemanticCoreClientConfig) {
    this.config = {
      timeout: 30000,
      retries: 3,
      ...config,
    };

    this.logger = config.logger || createDefaultLogger();

    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': '@mycodexvantaos/semantic-core-client/1.0.0',
      },
    });

    this.setupRetryInterceptor();
  }

  /**
   * Make a decision based on hypothesis and evidence
   */
  async decide(context: DecisionContext): Promise<Decision> {
    const requestId = context.request_id || generateRequestId();
    const startTime = Date.now();

    try {
      this.logger.info('decision_request_sent', {
        request_id: requestId,
        hypothesis: context.hypothesis.substring(0, 100),
        evidence_count: context.evidence.length,
      });

      const response = await this.client.post<Decision>('/v1/decide', {
        ...context,
        request_id: requestId,
        evidence: context.evidence.map((e) => ({
          ...e,
          timestamp: e.timestamp.toISOString(),
        })),
      });

      const decision = response.data;
      const processingTime = Date.now() - startTime;

      this.logger.info('decision_received', {
        request_id: requestId,
        verdict: decision.verdict,
        confidence: decision.confidence,
        processing_time_ms: processingTime,
      });

      return decision;
    } catch (error) {
      this.logger.error('decision_failed', {
        request_id: requestId,
        error: this.formatError(error),
        processing_time_ms: Date.now() - startTime,
      });

      throw this.handleError(error);
    }
  }

  /**
   * Get health status
   */
  async getHealth() {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error) {
      this.logger.error('health_check_failed', { error: this.formatError(error) });
      throw this.handleError(error);
    }
  }

  /**
   * Get detailed health status
   */
  async getHealthDetailed() {
    try {
      const response = await this.client.get('/health/detailed');
      return response.data;
    } catch (error) {
      this.logger.error('detailed_health_check_failed', { error: this.formatError(error) });
      throw this.handleError(error);
    }
  }

  /**
   * Get current configuration
   */
  async getConfig() {
    try {
      const response = await this.client.get('/v1/config');
      return response.data;
    } catch (error) {
      this.logger.error('config_fetch_failed', { error: this.formatError(error) });
      throw this.handleError(error);
    }
  }

  /**
   * Update configuration
   */
  async updateConfig(updates: Record<string, any>) {
    try {
      const response = await this.client.patch('/v1/config', updates);
      this.logger.info('config_updated', { updates });
      return response.data;
    } catch (error) {
      this.logger.error('config_update_failed', { error: this.formatError(error) });
      throw this.handleError(error);
    }
  }

  /**
   * Get metrics
   */
  async getMetrics() {
    try {
      const response = await this.client.get('/v1/metrics');
      return response.data;
    } catch (error) {
      this.logger.error('metrics_fetch_failed', { error: this.formatError(error) });
      throw this.handleError(error);
    }
  }

  /**
   * Setup retry interceptor
   */
  private setupRetryInterceptor() {
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const config = error.config as any;

        if (!config || !this.shouldRetry(error)) {
          return Promise.reject(error);
        }

        config.retryCount = config.retryCount || 0;

        if (config.retryCount >= (this.config.retries || 3)) {
          return Promise.reject(error);
        }

        config.retryCount += 1;

        const delay = this.getRetryDelay(config.retryCount);
        await new Promise((resolve) => setTimeout(resolve, delay));

        return this.client(config);
      }
    );
  }

  /**
   * Check if error should be retried
   */
  private shouldRetry(error: AxiosError): boolean {
    if (!error.response) {
      return true;
    }

    const status = error.response.status;
    return status === 408 || status === 429 || status >= 500;
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private getRetryDelay(retryCount: number): number {
    return Math.min(1000 * Math.pow(2, retryCount - 1), 10000);
  }

  /**
   * Handle API errors
   */
  private handleError(error: any): Error {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data as any;

        switch (status) {
          case 400:
            return new ValidationError(data.error || 'Invalid input');
          case 401:
            return new AuthenticationError('Unauthorized');
          case 403:
            return new ForbiddenError('Forbidden');
          case 404:
            return new NotFoundError(data.error || 'Resource not found');
          case 429:
            return new RateLimitError('Too many requests');
          case 500:
            return new ServerError(data.error || 'Internal server error');
          default:
            return new SemanticCoreError(`API error: ${status}`);
        }
      } else if (error.request) {
        return new NetworkError('No response from server');
      }
    }

    return new SemanticCoreError(error.message || 'Unknown error');
  }

  /**
   * Format error for logging
   */
  private formatError(error: any): string {
    if (axios.isAxiosError(error)) {
      return `${error.response?.status || 'N/A'}: ${error.message}`;
    }
    return error.message || 'Unknown error';
  }
}

/**
 * Factory function
 */
export function createSemanticCoreClient(
  baseUrl: string,
  logger?: Logger
): SemanticCoreClient {
  return new SemanticCoreClient({ baseUrl, logger });
}

export * from './types';
export * from './errors';
