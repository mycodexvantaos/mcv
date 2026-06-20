export class MonitoringFramework {
  private monitors: Map<string, any> = new Map();
  private metrics: Map<string, number[]> = new Map();
  
  registerMonitor(id: string, monitor: any): void {
    this.monitors.set(id, monitor);
    this.metrics.set(id, []);
  }
  
  recordMetric(id: string, value: number): void {
    const metrics = this.metrics.get(id) || [];
    metrics.push(value);
    this.metrics.set(id, metrics);
  }
  
  getMetrics(id: string): number[] {
    return this.metrics.get(id) || [];
  }
  
  getAllMetrics(): Record<string, number[]> {
    const result: Record<string, number[]> = {};
    this.metrics.forEach((values, id) => {
      result[id] = values;
    });
    return result;
  }
}
