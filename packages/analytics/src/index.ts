/**
 * MyCodeXvantaOS Analytics Engine
 * Provides data analytics and metrics collection
 */

export interface Metric {
  name: string;
  value: number;
  timestamp: number;
  labels: Record<string, string>;
}

export interface MetricQuery {
  name: string;
  startTime?: number;
  endTime?: number;
  labels?: Record<string, string>;
}

export class Analytics {
  private metrics: Metric[] = [];

  async record(metric: Metric): Promise<void> {
    this.metrics.push({
      ...metric,
      timestamp: metric.timestamp || Date.now(),
    });
  }

  async query(query: MetricQuery): Promise<Metric[]> {
    return this.metrics.filter((m) => {
      if (m.name !== query.name) return false;
      if (query.startTime && m.timestamp < query.startTime) return false;
      if (query.endTime && m.timestamp > query.endTime) return false;
      if (query.labels) {
        for (const [key, value] of Object.entries(query.labels)) {
          if (m.labels[key] !== value) return false;
        }
      }
      return true;
    });
  }

  async aggregate(metricName: string, aggregation: "sum" | "avg" | "min" | "max"): Promise<number> {
    const values = this.metrics.filter((m) => m.name === metricName).map((m) => m.value);

    if (values.length === 0) return 0;

    switch (aggregation) {
      case "sum":
        return values.reduce((a, b) => a + b, 0);
      case "avg":
        return values.reduce((a, b) => a + b, 0) / values.length;
      case "min":
        return Math.min(...values);
      case "max":
        return Math.max(...values);
    }
  }
}

export default Analytics;
