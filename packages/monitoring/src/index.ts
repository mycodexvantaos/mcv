/**
 * MyCodeXvantaOS Monitoring
 * Monitoring and observability with metrics, logs, and traces
 */

export interface MetricData {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

export interface LogEntry {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: number;
  context?: any;
}

export interface AlertRule {
  id: string;
  name: string;
  metric: string;
  threshold: number;
  condition: 'greater' | 'less' | 'equal';
  callback: (data: any) => void;
}

export class Monitoring {
  private metrics: Map<string, MetricData[]>;
  private logs: LogEntry[];
  private alerts: AlertRule[];

  constructor() {
    this.metrics = new Map();
    this.logs = [];
    this.alerts = [];
  }

  async initialize(): Promise<void> {
    console.log('Monitoring service initialized');
    this.startAlertProcessing();
  }

  async execute<T = any>(operation: any): Promise<T> {
    const { action, data } = operation;

    switch (action) {
      case 'recordMetric':
        return (await this.recordMetric(data)) as T;
      case 'getMetrics':
        return (await this.getMetrics(data)) as T;
      case 'log':
        return (await this.log(data)) as T;
      case 'getLogs':
        return (await this.getLogs(data)) as T;
      case 'createAlert':
        return (await this.createAlert(data)) as T;
      default:
        throw new Error(`Unknown monitoring action: ${action}`);
    }
  }

  async recordMetric(metric: any): Promise<void> {
    const metricData: MetricData = {
      name: metric.name,
      value: metric.value,
      timestamp: Date.now(),
      tags: metric.tags,
    };

    if (!this.metrics.has(metric.name)) {
      this.metrics.set(metric.name, []);
    }

    this.metrics.get(metric.name)!.push(metricData);

    // Check alerts
    this.checkAlerts(metricData);
  }

  async getMetrics(filter?: any): Promise<MetricData[]> {
    if (filter?.name) {
      return this.metrics.get(filter.name) || [];
    }

    const allMetrics: MetricData[] = [];
    this.metrics.forEach((metrics) => {
      allMetrics.push(...metrics);
    });

    return allMetrics;
  }

  async log(logEntry: any): Promise<void> {
    const entry: LogEntry = {
      level: logEntry.level || 'info',
      message: logEntry.message,
      timestamp: Date.now(),
      context: logEntry.context,
    };

    this.logs.push(entry);
    console.log(`[${entry.level.toUpperCase()}] ${entry.message}`);
  }

  async getLogs(filter?: any): Promise<LogEntry[]> {
    let logs = this.logs;

    if (filter?.level) {
      logs = logs.filter((l) => l.level === filter.level);
    }

    if (filter?.limit) {
      logs = logs.slice(-filter.limit);
    }

    return logs;
  }

  async createAlert(alert: any): Promise<AlertRule> {
    const alertRule: AlertRule = {
      id: `urn:mycodexvantaos:alert:${Date.now()}`,
      name: alert.name,
      metric: alert.metric,
      threshold: alert.threshold,
      condition: alert.condition,
      callback: alert.callback,
    };

    this.alerts.push(alertRule);
    console.log(`Alert created: ${alertRule.name}`);
    return alertRule;
  }

  private checkAlerts(metric: MetricData): void {
    for (const alert of this.alerts) {
      if (alert.metric !== metric.name) continue;

      let triggered = false;
      switch (alert.condition) {
        case 'greater':
          triggered = metric.value > alert.threshold;
          break;
        case 'less':
          triggered = metric.value < alert.threshold;
          break;
        case 'equal':
          triggered = metric.value === alert.threshold;
          break;
      }

      if (triggered) {
        alert.callback({ metric, alert });
      }
    }
  }

  private startAlertProcessing(): void {
    setInterval(() => {
      // Process alerts periodically
    }, 60000); // Every minute
  }

  async cleanup(): Promise<void> {
    this.metrics.clear();
    this.logs = [];
    this.alerts = [];
    console.log('Monitoring service cleaned up');
  }
}

export const monitoring = new Monitoring();
