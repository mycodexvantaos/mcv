/**
 * Advanced Performance Tuning Framework
 * Analyzes metrics and optimizes parameters in real-time
 */

export interface PerformanceMetrics {
  timestamp: Date;
  responseTime: number;
  memoryUsage: number;
  cpuUsage: number;
  throughput: number;
  errorRate: number;
  cacheHitRate: number;
}

export interface TuningParameter {
  name: string;
  value: number;
  min: number;
  max: number;
  step: number;
  impact: 'high' | 'medium' | 'low';
}

export class PerformanceTuner {
  private metrics: PerformanceMetrics[] = [];
  private parameters: Map<string, TuningParameter> = new Map();
  private tuningHistory: Array<{ timestamp: Date; changes: Record<string, number> }> = [];

  constructor() {
    this.initializeDefaultParameters();
  }

  private initializeDefaultParameters(): void {
    const defaultParams: TuningParameter[] = [
      {
        name: 'cache_ttl',
        value: 3600,
        min: 60,
        max: 86400,
        step: 60,
        impact: 'high',
      },
      {
        name: 'batch_size',
        value: 100,
        min: 10,
        max: 1000,
        step: 10,
        impact: 'high',
      },
      {
        name: 'connection_pool_size',
        value: 20,
        min: 5,
        max: 100,
        step: 5,
        impact: 'medium',
      },
      {
        name: 'request_timeout',
        value: 5000,
        min: 1000,
        max: 30000,
        step: 1000,
        impact: 'medium',
      },
      {
        name: 'max_retries',
        value: 3,
        min: 1,
        max: 10,
        step: 1,
        impact: 'low',
      },
      {
        name: 'circuit_breaker_threshold',
        value: 0.5,
        min: 0.1,
        max: 0.9,
        step: 0.1,
        impact: 'high',
      },
    ];

    defaultParams.forEach((param) => {
      this.parameters.set(param.name, param);
    });
  }

  recordMetrics(metrics: PerformanceMetrics): void {
    this.metrics.push(metrics);
    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics.shift();
    }
  }

  analyzeAndOptimize(): Record<string, number> {
    if (this.metrics.length < 10) {
      return {};
    }

    const recentMetrics = this.metrics.slice(-100);
    const avgResponseTime = recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentMetrics.length;
    const avgMemory = recentMetrics.reduce((sum, m) => sum + m.memoryUsage, 0) / recentMetrics.length;
    const avgErrorRate = recentMetrics.reduce((sum, m) => sum + m.errorRate, 0) / recentMetrics.length;
    const avgCacheHitRate = recentMetrics.reduce((sum, m) => sum + m.cacheHitRate, 0) / recentMetrics.length;

    const changes: Record<string, number> = {};

    // Optimize cache TTL based on cache hit rate
    if (avgCacheHitRate < 0.5) {
      const cacheTtl = this.parameters.get('cache_ttl')!;
      const newValue = Math.min(cacheTtl.value * 1.2, cacheTtl.max);
      changes['cache_ttl'] = newValue;
      cacheTtl.value = newValue;
    } else if (avgCacheHitRate > 0.9) {
      const cacheTtl = this.parameters.get('cache_ttl')!;
      const newValue = Math.max(cacheTtl.value * 0.9, cacheTtl.min);
      changes['cache_ttl'] = newValue;
      cacheTtl.value = newValue;
    }

    // Optimize batch size based on response time
    if (avgResponseTime > 2000) {
      const batchSize = this.parameters.get('batch_size')!;
      const newValue = Math.max(batchSize.value * 0.8, batchSize.min);
      changes['batch_size'] = newValue;
      batchSize.value = newValue;
    } else if (avgResponseTime < 500) {
      const batchSize = this.parameters.get('batch_size')!;
      const newValue = Math.min(batchSize.value * 1.2, batchSize.max);
      changes['batch_size'] = newValue;
      batchSize.value = newValue;
    }

    // Optimize connection pool based on memory
    if (avgMemory > 0.8) {
      const poolSize = this.parameters.get('connection_pool_size')!;
      const newValue = Math.max(poolSize.value * 0.9, poolSize.min);
      changes['connection_pool_size'] = newValue;
      poolSize.value = newValue;
    }

    // Optimize circuit breaker based on error rate
    if (avgErrorRate > 0.1) {
      const threshold = this.parameters.get('circuit_breaker_threshold')!;
      const newValue = Math.max(threshold.value * 0.9, threshold.min);
      changes['circuit_breaker_threshold'] = newValue;
      threshold.value = newValue;
    }

    if (Object.keys(changes).length > 0) {
      this.tuningHistory.push({
        timestamp: new Date(),
        changes,
      });
    }

    return changes;
  }

  getParameters(): Record<string, number> {
    const result: Record<string, number> = {};
    this.parameters.forEach((param, name) => {
      result[name] = param.value;
    });
    return result;
  }

  getTuningHistory(limit: number = 50): Array<{ timestamp: Date; changes: Record<string, number> }> {
    return this.tuningHistory.slice(-limit);
  }

  getMetricsTrend(windowSize: number = 100): {
    avgResponseTime: number;
    avgMemory: number;
    avgErrorRate: number;
    avgCacheHitRate: number;
  } {
    const recent = this.metrics.slice(-windowSize);
    if (recent.length === 0) {
      return { avgResponseTime: 0, avgMemory: 0, avgErrorRate: 0, avgCacheHitRate: 0 };
    }

    return {
      avgResponseTime: recent.reduce((sum, m) => sum + m.responseTime, 0) / recent.length,
      avgMemory: recent.reduce((sum, m) => sum + m.memoryUsage, 0) / recent.length,
      avgErrorRate: recent.reduce((sum, m) => sum + m.errorRate, 0) / recent.length,
      avgCacheHitRate: recent.reduce((sum, m) => sum + m.cacheHitRate, 0) / recent.length,
    };
  }
}

export const performanceTuner = new PerformanceTuner();
