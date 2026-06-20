/**
 * Continuous Improvement and Feedback Loop System
 */

export interface ImprovementSuggestion {
  id: string;
  timestamp: Date;
  category: 'strategy' | 'parameter' | 'threshold' | 'process';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  priority: number;
  status: 'pending' | 'implemented' | 'rejected';
  metrics?: Record<string, number>;
}

export interface FeedbackItem {
  id: string;
  timestamp: Date;
  type: 'positive' | 'negative' | 'neutral';
  source: string;
  content: string;
  relatedDecisionId?: string;
}

export class ContinuousImprovement {
  private suggestions: ImprovementSuggestion[] = [];
  private feedback: FeedbackItem[] = [];
  private implementationLog: Array<{ suggestion: ImprovementSuggestion; result: 'success' | 'failure' }> = [];

  recordFeedback(feedback: FeedbackItem): void {
    this.feedback.push(feedback);
  }

  generateSuggestions(metrics: Record<string, number>): ImprovementSuggestion[] {
    const suggestions: ImprovementSuggestion[] = [];

    // Suggestion 1: Improve low accuracy
    if (metrics.accuracy && metrics.accuracy < 0.7) {
      suggestions.push({
        id: `sugg_${Date.now()}_1`,
        timestamp: new Date(),
        category: 'strategy',
        title: 'Improve Decision Accuracy',
        description: 'Current accuracy is below 70%. Consider adjusting strategy weights or thresholds.',
        impact: 'high',
        priority: 1,
        status: 'pending',
        metrics: { currentAccuracy: metrics.accuracy },
      });
    }

    // Suggestion 2: Optimize slow response time
    if (metrics.avgResponseTime && metrics.avgResponseTime > 2000) {
      suggestions.push({
        id: `sugg_${Date.now()}_2`,
        timestamp: new Date(),
        category: 'parameter',
        title: 'Optimize Response Time',
        description: 'Average response time exceeds 2 seconds. Consider caching or batch optimization.',
        impact: 'high',
        priority: 2,
        status: 'pending',
        metrics: { currentResponseTime: metrics.avgResponseTime },
      });
    }

    // Suggestion 3: Improve cache efficiency
    if (metrics.cacheHitRate && metrics.cacheHitRate < 0.5) {
      suggestions.push({
        id: `sugg_${Date.now()}_3`,
        timestamp: new Date(),
        category: 'parameter',
        title: 'Improve Cache Efficiency',
        description: 'Cache hit rate is below 50%. Consider increasing TTL or adjusting cache strategy.',
        impact: 'medium',
        priority: 3,
        status: 'pending',
        metrics: { currentCacheHitRate: metrics.cacheHitRate },
      });
    }

    // Suggestion 4: Reduce error rate
    if (metrics.errorRate && metrics.errorRate > 0.05) {
      suggestions.push({
        id: `sugg_${Date.now()}_4`,
        timestamp: new Date(),
        category: 'process',
        title: 'Reduce Error Rate',
        description: 'Error rate is above 5%. Investigate and implement error handling improvements.',
        impact: 'high',
        priority: 2,
        status: 'pending',
        metrics: { currentErrorRate: metrics.errorRate },
      });
    }

    // Suggestion 5: Enhance strategy diversity
    if (metrics.strategyCount && metrics.strategyCount < 3) {
      suggestions.push({
        id: `sugg_${Date.now()}_5`,
        timestamp: new Date(),
        category: 'strategy',
        title: 'Enhance Strategy Diversity',
        description: 'Consider implementing additional decision strategies for better coverage.',
        impact: 'medium',
        priority: 4,
        status: 'pending',
      });
    }

    this.suggestions.push(...suggestions);
    return suggestions;
  }

  implementSuggestion(suggestionId: string, result: 'success' | 'failure'): void {
    const suggestion = this.suggestions.find((s) => s.id === suggestionId);
    if (suggestion) {
      suggestion.status = result === 'success' ? 'implemented' : 'rejected';
      this.implementationLog.push({ suggestion, result });
    }
  }

  getPendingSuggestions(): ImprovementSuggestion[] {
    return this.suggestions
      .filter((s) => s.status === 'pending')
      .sort((a, b) => a.priority - b.priority);
  }

  getImplementationHistory(limit: number = 50): Array<{ suggestion: ImprovementSuggestion; result: 'success' | 'failure' }> {
    return this.implementationLog.slice(-limit);
  }

  analyzeFeedback(): {
    positiveCount: number;
    negativeCount: number;
    neutralCount: number;
    sentimentScore: number;
    topIssues: Array<{ issue: string; count: number }>;
  } {
    const positiveCount = this.feedback.filter((f) => f.type === 'positive').length;
    const negativeCount = this.feedback.filter((f) => f.type === 'negative').length;
    const neutralCount = this.feedback.filter((f) => f.type === 'neutral').length;
    const total = this.feedback.length;

    const sentimentScore = total > 0 ? (positiveCount - negativeCount) / total : 0;

    // Extract top issues from negative feedback
    const issues: Record<string, number> = {};
    this.feedback
      .filter((f) => f.type === 'negative')
      .forEach((f) => {
        const words = f.content.split(' ');
        words.forEach((word) => {
          if (word.length > 3) {
            issues[word] = (issues[word] || 0) + 1;
          }
        });
      });

    const topIssues = Object.entries(issues)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([issue, count]) => ({ issue, count }));

    return { positiveCount, negativeCount, neutralCount, sentimentScore, topIssues };
  }

  generateImprovementReport(): string {
    const lines: string[] = [];
    const feedbackAnalysis = this.analyzeFeedback();
    const pendingSuggestions = this.getPendingSuggestions();
    const implementedCount = this.suggestions.filter((s) => s.status === 'implemented').length;

    lines.push('# Continuous Improvement Report');
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push('');

    lines.push('## Feedback Analysis');
    lines.push(`- Positive Feedback: ${feedbackAnalysis.positiveCount}`);
    lines.push(`- Negative Feedback: ${feedbackAnalysis.negativeCount}`);
    lines.push(`- Neutral Feedback: ${feedbackAnalysis.neutralCount}`);
    lines.push(`- Sentiment Score: ${feedbackAnalysis.sentimentScore.toFixed(2)}`);
    lines.push('');

    lines.push('## Top Issues');
    feedbackAnalysis.topIssues.forEach((issue) => {
      lines.push(`- ${issue.issue}: ${issue.count} mentions`);
    });
    lines.push('');

    lines.push('## Improvement Suggestions');
    lines.push(`- Total Suggestions: ${this.suggestions.length}`);
    lines.push(`- Pending: ${pendingSuggestions.length}`);
    lines.push(`- Implemented: ${implementedCount}`);
    lines.push('');

    lines.push('## Pending Actions');
    pendingSuggestions.slice(0, 5).forEach((s) => {
      lines.push(`- [${s.impact.toUpperCase()}] ${s.title}`);
      lines.push(`  ${s.description}`);
    });

    return lines.join('\n');
  }
}

export const continuousImprovement = new ContinuousImprovement();
