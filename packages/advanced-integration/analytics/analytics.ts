/**
 * Advanced Analytics System
 * Decision analytics, performance analytics, user behavior
 */

export interface AnalyticsEvent {
  id: string;
  type: string;
  userId: string;
  data: Record<string, any>;
  timestamp: Date;
}

export class AnalyticsEngine {
  private events: AnalyticsEvent[] = [];
  
  trackEvent(type: string, userId: string, data: Record<string, any>): void {
    this.events.push({
      id: `evt_${Date.now()}`,
      type,
      userId,
      data,
      timestamp: new Date()
    });
  }
  
  getDecisionAnalytics(): Record<string, any> {
    const decisions = this.events.filter(e => e.type === 'decision');
    return {
      total: decisions.length,
      accuracy: this.calculateAccuracy(decisions),
      avgConfidence: this.calculateAvgConfidence(decisions)
    };
  }
  
  getPerformanceAnalytics(): Record<string, any> {
    const performance = this.events.filter(e => e.type === 'performance');
    return {
      avgResponseTime: this.calculateAvgResponseTime(performance),
      throughput: this.calculateThroughput(performance),
      errorRate: this.calculateErrorRate(performance)
    };
  }
  
  private calculateAccuracy(events: AnalyticsEvent[]): number {
    if (events.length === 0) return 0;
    const correct = events.filter(e => e.data.correct).length;
    return correct / events.length;
  }
  
  private calculateAvgConfidence(events: AnalyticsEvent[]): number {
    if (events.length === 0) return 0;
    const sum = events.reduce((acc, e) => acc + (e.data.confidence || 0), 0);
    return sum / events.length;
  }
  
  private calculateAvgResponseTime(events: AnalyticsEvent[]): number {
    if (events.length === 0) return 0;
    const sum = events.reduce((acc, e) => acc + (e.data.responseTime || 0), 0);
    return sum / events.length;
  }
  
  private calculateThroughput(events: AnalyticsEvent[]): number {
    if (events.length === 0) return 0;
    const timeRange = (events[events.length - 1].timestamp.getTime() - events[0].timestamp.getTime()) / 1000;
    return events.length / timeRange;
  }
  
  private calculateErrorRate(events: AnalyticsEvent[]): number {
    if (events.length === 0) return 0;
    const errors = events.filter(e => e.data.error).length;
    return errors / events.length;
  }
}

export const analyticsEngine = new AnalyticsEngine();
