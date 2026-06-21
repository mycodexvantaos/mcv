export class UnifiedLoggingFramework {
  private logs: any[] = [];

  log(level: string, message: string, metadata?: any): void {
    this.logs.push({
      timestamp: new Date(),
      level,
      message,
      metadata,
      correlationId: this.generateCorrelationId(),
    });
  }

  private generateCorrelationId(): string {
    return `corr_${Date.now()}`;
  }

  getLogs(): any[] {
    return this.logs;
  }
}
