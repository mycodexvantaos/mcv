/**
 * MyCodeXvantaOS Advanced Monitoring
 * Provides comprehensive monitoring, alerting, and health checks
 */

export interface Monitor {
  name: string;
  check: () => Promise<{ healthy: boolean; message: string }>;
  interval: number;
}

export interface Alert {
  id: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  timestamp: number;
}

export class AdvancedMonitoring {
  private monitors: Map<string, Monitor> = new Map();
  private alerts: Alert[] = [];
  private running: boolean = false;

  registerMonitor(monitor: Monitor): void {
    this.monitors.set(monitor.name, monitor);
  }

  async runChecks(): Promise<void> {
    const now = Date.now();
    for (const monitor of this.monitors.values()) {
      try {
        const result = await monitor.check();
        if (!result.healthy) {
          this.alerts.push({
            id: `alert_${now}_${monitor.name}`,
            severity: 'warning',
            message: `Monitor ${monitor.name}: ${result.message}`,
            timestamp: now,
          });
        }
      } catch (error) {
        this.alerts.push({
          id: `alert_${now}_${monitor.name}`,
          severity: 'error',
          message: `Monitor ${monitor.name} failed: ${error}`,
          timestamp: now,
        });
      }
    }
  }

  async start(): Promise<void> {
    this.running = true;
    setInterval(() => this.runChecks(), 60000); // Run every minute
  }

  async stop(): Promise<void> {
    this.running = false;
  }

  getAlerts(severity?: string): Alert[] {
    if (severity) {
      return this.alerts.filter((a) => a.severity === severity);
    }
    return this.alerts;
  }

  clearAlerts(): void {
    this.alerts = [];
  }
}

export default AdvancedMonitoring;
