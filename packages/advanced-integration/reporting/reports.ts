/**
 * Advanced Reporting System
 * Daily, weekly, monthly reports with scheduling
 */

export interface Report {
  id: string;
  type: 'daily' | 'weekly' | 'monthly';
  generatedAt: Date;
  data: Record<string, any>;
  content: string;
}

export class ReportingEngine {
  private reports: Report[] = [];

  generateDailyReport(data: Record<string, any>): Report {
    const report: Report = {
      id: `rpt_${Date.now()}`,
      type: 'daily',
      generatedAt: new Date(),
      data,
      content: this.formatReport(data, 'Daily Report'),
    };
    this.reports.push(report);
    return report;
  }

  generateWeeklyReport(data: Record<string, any>): Report {
    const report: Report = {
      id: `rpt_${Date.now()}`,
      type: 'weekly',
      generatedAt: new Date(),
      data,
      content: this.formatReport(data, 'Weekly Report'),
    };
    this.reports.push(report);
    return report;
  }

  generateMonthlyReport(data: Record<string, any>): Report {
    const report: Report = {
      id: `rpt_${Date.now()}`,
      type: 'monthly',
      generatedAt: new Date(),
      data,
      content: this.formatReport(data, 'Monthly Report'),
    };
    this.reports.push(report);
    return report;
  }

  private formatReport(data: Record<string, any>, title: string): string {
    return `
# ${title}
Generated: ${new Date().toISOString()}

## Summary
${JSON.stringify(data, null, 2)}

## Metrics
- Total Decisions: ${data.totalDecisions || 0}
- Accuracy: ${data.accuracy || 0}%
- Response Time: ${data.avgResponseTime || 0}ms
- Error Rate: ${data.errorRate || 0}%

## Recommendations
${this.generateRecommendations(data)}
    `.trim();
  }

  private generateRecommendations(data: Record<string, any>): string {
    const recommendations = [];
    if ((data.errorRate || 0) > 0.05) {
      recommendations.push('- Investigate high error rate');
    }
    if ((data.avgResponseTime || 0) > 500) {
      recommendations.push('- Optimize performance');
    }
    if ((data.accuracy || 0) < 0.85) {
      recommendations.push('- Review decision strategies');
    }
    return recommendations.join('\n') || '- System performing well';
  }

  getReports(type?: string): Report[] {
    return type ? this.reports.filter((r) => r.type === type) : this.reports;
  }
}

export const reportingEngine = new ReportingEngine();
