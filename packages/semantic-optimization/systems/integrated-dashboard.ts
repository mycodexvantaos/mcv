/**
 * Integrated Dashboard and Reporting System
 */

export interface DashboardMetrics {
  timestamp: Date;
  performance: {
    responseTime: number;
    throughput: number;
    errorRate: number;
    uptime: number;
  };
  quality: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
  };
  optimization: {
    cacheHitRate: number;
    memoryUsage: number;
    cpuUsage: number;
    activeConnections: number;
  };
  feedback: {
    sentimentScore: number;
    positiveCount: number;
    negativeCount: number;
    pendingSuggestions: number;
  };
}

export class IntegratedDashboard {
  private metricsHistory: DashboardMetrics[] = [];
  private alerts: Array<{
    timestamp: Date;
    severity: "info" | "warning" | "critical";
    message: string;
  }> = [];

  recordMetrics(metrics: DashboardMetrics): void {
    this.metricsHistory.push(metrics);
    if (this.metricsHistory.length > 10000) {
      this.metricsHistory.shift();
    }
  }

  addAlert(severity: "info" | "warning" | "critical", message: string): void {
    this.alerts.push({ timestamp: new Date(), severity, message });
    if (this.alerts.length > 1000) {
      this.alerts.shift();
    }
  }

  getCurrentMetrics(): DashboardMetrics | null {
    return this.metricsHistory.length > 0
      ? this.metricsHistory[this.metricsHistory.length - 1]
      : null;
  }

  getMetricsTrend(timeWindowMs: number = 3600000): {
    avgResponseTime: number;
    avgThroughput: number;
    avgErrorRate: number;
    avgAccuracy: number;
    avgCacheHitRate: number;
  } {
    const now = Date.now();
    const relevant = this.metricsHistory.filter((m) => now - m.timestamp.getTime() < timeWindowMs);

    if (relevant.length === 0) {
      return {
        avgResponseTime: 0,
        avgThroughput: 0,
        avgErrorRate: 0,
        avgAccuracy: 0,
        avgCacheHitRate: 0,
      };
    }

    return {
      avgResponseTime:
        relevant.reduce((sum, m) => sum + m.performance.responseTime, 0) / relevant.length,
      avgThroughput:
        relevant.reduce((sum, m) => sum + m.performance.throughput, 0) / relevant.length,
      avgErrorRate: relevant.reduce((sum, m) => sum + m.performance.errorRate, 0) / relevant.length,
      avgAccuracy: relevant.reduce((sum, m) => sum + m.quality.accuracy, 0) / relevant.length,
      avgCacheHitRate:
        relevant.reduce((sum, m) => sum + m.optimization.cacheHitRate, 0) / relevant.length,
    };
  }

  getHealthStatus(): "healthy" | "degraded" | "critical" {
    const current = this.getCurrentMetrics();
    if (!current) return "critical";

    if (current.performance.errorRate > 0.1 || current.quality.accuracy < 0.5) {
      return "critical";
    }
    if (current.performance.errorRate > 0.05 || current.quality.accuracy < 0.7) {
      return "degraded";
    }
    return "healthy";
  }

  getRecentAlerts(
    limit: number = 50
  ): Array<{ timestamp: Date; severity: "info" | "warning" | "critical"; message: string }> {
    return this.alerts.slice(-limit);
  }

  generateDashboardReport(): string {
    const current = this.getCurrentMetrics();
    const trend = this.getMetricsTrend();
    const health = this.getHealthStatus();
    const recentAlerts = this.getRecentAlerts(5);

    const lines: string[] = [];

    lines.push("# Semantic Core Dashboard Report");
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push(`Health Status: ${health.toUpperCase()}`);
    lines.push("");

    if (current) {
      lines.push("## Current Performance");
      lines.push(`- Response Time: ${current.performance.responseTime.toFixed(2)}ms`);
      lines.push(`- Throughput: ${current.performance.throughput.toFixed(2)} req/s`);
      lines.push(`- Error Rate: ${(current.performance.errorRate * 100).toFixed(2)}%`);
      lines.push(`- Uptime: ${(current.performance.uptime / 3600).toFixed(2)}h`);
      lines.push("");

      lines.push("## Quality Metrics");
      lines.push(`- Accuracy: ${(current.quality.accuracy * 100).toFixed(2)}%`);
      lines.push(`- Precision: ${(current.quality.precision * 100).toFixed(2)}%`);
      lines.push(`- Recall: ${(current.quality.recall * 100).toFixed(2)}%`);
      lines.push(`- F1 Score: ${current.quality.f1Score.toFixed(4)}`);
      lines.push("");

      lines.push("## Optimization Status");
      lines.push(`- Cache Hit Rate: ${(current.optimization.cacheHitRate * 100).toFixed(2)}%`);
      lines.push(`- Memory Usage: ${(current.optimization.memoryUsage * 100).toFixed(2)}%`);
      lines.push(`- CPU Usage: ${(current.optimization.cpuUsage * 100).toFixed(2)}%`);
      lines.push(`- Active Connections: ${current.optimization.activeConnections}`);
      lines.push("");
    }

    lines.push("## Trend Analysis (Last Hour)");
    lines.push(`- Avg Response Time: ${trend.avgResponseTime.toFixed(2)}ms`);
    lines.push(`- Avg Throughput: ${trend.avgThroughput.toFixed(2)} req/s`);
    lines.push(`- Avg Error Rate: ${(trend.avgErrorRate * 100).toFixed(2)}%`);
    lines.push(`- Avg Accuracy: ${(trend.avgAccuracy * 100).toFixed(2)}%`);
    lines.push("");

    lines.push("## Recent Alerts");
    recentAlerts.forEach((alert) => {
      lines.push(`- [${alert.severity.toUpperCase()}] ${alert.message}`);
    });

    return lines.join("\n");
  }

  exportJSON(): string {
    const current = this.getCurrentMetrics();
    const trend = this.getMetricsTrend();
    const health = this.getHealthStatus();

    return JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        health,
        current,
        trend,
        recentAlerts: this.getRecentAlerts(10),
      },
      null,
      2
    );
  }
}

export const integratedDashboard = new IntegratedDashboard();
