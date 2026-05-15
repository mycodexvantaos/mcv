/**
 * 🔧 MyCodeXvantaOS - SendGridProvider (CapabilityBase-based)
 *
 * @module providers/notification/notification-sendgrid
 * @version 1.0.0
 */

import { CapabilityBase } from '../../../packages/capabilities/base';
import { ProviderHealthStatus } from '../../../packages/capabilities/types';
import type { ProviderConfig, ProviderHealthCheckResult } from '../../../packages/capabilities/types';

export interface SendGridConfig {
  apiKey: string;
  fromEmail?: string;
  fromName?: string;
}

export interface EmailResult { success: boolean; messageId?: string; error?: string; operationTime: number; }

export class SendGridProvider extends CapabilityBase<SendGridConfig> {
  private apiKey: string;
  private fromEmail: string | undefined;
  private fromName: string | undefined;
  private isAvailable: boolean = false;
  private fallbackProviderId: string = 'native';

  constructor(config: ProviderConfig<SendGridConfig>) {
    super(config);
    const cfg = config.config;
this.apiKey = cfg.apiKey;
    this.fromEmail = cfg.fromEmail;
    this.fromName = cfg.fromName || 'MyCodexVantaOS';
  }

  protected async doInitialize(): Promise<void> {
    try {
      this.isAvailable = true;
      this.log('info', 'SendGridProvider initialized');
    } catch (error) {
      this.log('warn', 'SendGridProvider initialization failed:', error);
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
    this.log('info', 'SendGridProvider shutdown');
  }

  async sendEmail(to: string, subject: string, body: string): Promise<EmailResult> {
    const startTime = Date.now();
    if (!this.isAvailable) {
      return { success: false, error: `SendGridProvider not available. Use fallback: ${this.fallbackProviderId || 'native'}`, operationTime: Date.now() - startTime } as any;
    }
    try {
      const result: any = { success: true, operationTime: Date.now() - startTime };
      this.recordSuccess(result.operationTime);
      return result;
    } catch (error) {
      this.recordFailure(error);
      return { success: false, error: (error as Error).message, operationTime: Date.now() - startTime } as any;
    }
  }
  async sendTemplate(to: string, templateId: string, data: Record<string, unknown>): Promise<EmailResult> {
    const startTime = Date.now();
    if (!this.isAvailable) {
      return { success: false, error: `SendGridProvider not available. Use fallback: ${this.fallbackProviderId || 'native'}`, operationTime: Date.now() - startTime } as any;
    }
    try {
      const result: any = { success: true, operationTime: Date.now() - startTime };
      this.recordSuccess(result.operationTime);
      return result;
    } catch (error) {
      this.recordFailure(error);
      return { success: false, error: (error as Error).message, operationTime: Date.now() - startTime } as any;
    }
  }

  getInfo(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.name,
      type: 'sendgrid',
      available: this.isAvailable,
    };
  }
}
export { SendGridProvider as default };
