/**
 * Comprehensive Data Analytics and Decision Tracking
 */

export interface DecisionRecord {
  id: string;
  timestamp: Date;
  hypothesis: string;
  evidence: Array<{ source: string; confidence: number }>;
  strategy: string;
  verdict: string;
  confidence: number;
  outcome?: 'correct' | 'incorrect' | 'unknown';
  feedback?: string;
}

export interface AnalyticsMetrics {
  totalDecisions: number;
  correctDecisions: number;
  incorrectDecisions: number;
  unknownOutcomes: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  averageConfidence: number;
  verdictDistribution: Record<string, number>;
  strategyPerformance: Record<string, { accuracy: number; count: number }>;
}

export class DataAnalytics {
  private decisions: DecisionRecord[] = [];
  private feedbackQueue: Array<{ decisionId: string; feedback: string }> = [];

  recordDecision(decision: DecisionRecord): void {
    this.decisions.push(decision);
  }

  recordFeedback(decisionId: string, outcome: 'correct' | 'incorrect', feedback?: string): void {
    const decision = this.decisions.find((d) => d.id === decisionId);
    if (decision) {
      decision.outcome = outcome;
      decision.feedback = feedback;
      this.feedbackQueue.push({ decisionId, feedback: feedback || '' });
    }
  }

  getAnalytics(): AnalyticsMetrics {
    const totalDecisions = this.decisions.length;
    const decidedDecisions = this.decisions.filter((d) => d.outcome !== undefined);
    const correctDecisions = this.decisions.filter((d) => d.outcome === 'correct').length;
    const incorrectDecisions = this.decisions.filter((d) => d.outcome === 'incorrect').length;
    const unknownOutcomes = totalDecisions - decidedDecisions.length;

    const accuracy = decidedDecisions.length > 0 ? correctDecisions / decidedDecisions.length : 0;
    const precision = this.calculatePrecision();
    const recall = this.calculateRecall();
    const f1Score = this.calculateF1Score(precision, recall);
    const averageConfidence =
      this.decisions.reduce((sum, d) => sum + d.confidence, 0) / totalDecisions;

    const verdictDistribution: Record<string, number> = {};
    this.decisions.forEach((d) => {
      verdictDistribution[d.verdict] = (verdictDistribution[d.verdict] || 0) + 1;
    });

    const strategyPerformance: Record<string, { accuracy: number; count: number }> = {};
    const strategyDecisions: Record<string, DecisionRecord[]> = {};

    this.decisions.forEach((d) => {
      if (!strategyDecisions[d.strategy]) {
        strategyDecisions[d.strategy] = [];
      }
      strategyDecisions[d.strategy].push(d);
    });

    Object.entries(strategyDecisions).forEach(([strategy, decisions]) => {
      const correct = decisions.filter((d) => d.outcome === 'correct').length;
      const decided = decisions.filter((d) => d.outcome !== undefined).length;
      strategyPerformance[strategy] = {
        accuracy: decided > 0 ? correct / decided : 0,
        count: decisions.length,
      };
    });

    return {
      totalDecisions,
      correctDecisions,
      incorrectDecisions,
      unknownOutcomes,
      accuracy,
      precision,
      recall,
      f1Score,
      averageConfidence,
      verdictDistribution,
      strategyPerformance,
    };
  }

  private calculatePrecision(): number {
    const truePositives = this.decisions.filter(
      (d) => d.verdict === 'ALLOW' && d.outcome === 'correct'
    ).length;
    const falsePositives = this.decisions.filter(
      (d) => d.verdict === 'ALLOW' && d.outcome === 'incorrect'
    ).length;
    return truePositives + falsePositives > 0
      ? truePositives / (truePositives + falsePositives)
      : 0;
  }

  private calculateRecall(): number {
    const truePositives = this.decisions.filter(
      (d) => d.verdict === 'ALLOW' && d.outcome === 'correct'
    ).length;
    const falseNegatives = this.decisions.filter(
      (d) => d.verdict === 'DENY' && d.outcome === 'incorrect'
    ).length;
    return truePositives + falseNegatives > 0
      ? truePositives / (truePositives + falseNegatives)
      : 0;
  }

  private calculateF1Score(precision: number, recall: number): number {
    return precision + recall > 0 ? (2 * (precision * recall)) / (precision + recall) : 0;
  }

  getDecisionTrend(windowSize: number = 100): {
    timestamps: Date[];
    accuracies: number[];
    confidences: number[];
  } {
    const recent = this.decisions.slice(-windowSize);
    const timestamps: Date[] = [];
    const accuracies: number[] = [];
    const confidences: number[] = [];

    let correctCount = 0;
    let totalCount = 0;

    recent.forEach((d) => {
      timestamps.push(d.timestamp);
      confidences.push(d.confidence);

      if (d.outcome !== undefined) {
        totalCount++;
        if (d.outcome === 'correct') {
          correctCount++;
        }
        accuracies.push(totalCount > 0 ? correctCount / totalCount : 0);
      }
    });

    return { timestamps, accuracies, confidences };
  }

  exportReport(): string {
    const analytics = this.getAnalytics();
    const lines: string[] = [];

    lines.push('# Semantic Core Analytics Report');
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push('');

    lines.push('## Summary');
    lines.push(`- Total Decisions: ${analytics.totalDecisions}`);
    lines.push(`- Correct: ${analytics.correctDecisions}`);
    lines.push(`- Incorrect: ${analytics.incorrectDecisions}`);
    lines.push(`- Unknown: ${analytics.unknownOutcomes}`);
    lines.push('');

    lines.push('## Performance Metrics');
    lines.push(`- Accuracy: ${(analytics.accuracy * 100).toFixed(2)}%`);
    lines.push(`- Precision: ${(analytics.precision * 100).toFixed(2)}%`);
    lines.push(`- Recall: ${(analytics.recall * 100).toFixed(2)}%`);
    lines.push(`- F1 Score: ${analytics.f1Score.toFixed(4)}`);
    lines.push(`- Average Confidence: ${(analytics.averageConfidence * 100).toFixed(2)}%`);
    lines.push('');

    lines.push('## Verdict Distribution');
    Object.entries(analytics.verdictDistribution).forEach(([verdict, count]) => {
      lines.push(`- ${verdict}: ${count}`);
    });
    lines.push('');

    lines.push('## Strategy Performance');
    Object.entries(analytics.strategyPerformance).forEach(([strategy, perf]) => {
      lines.push(`- ${strategy}: ${(perf.accuracy * 100).toFixed(2)}% (${perf.count} decisions)`);
    });

    return lines.join('\n');
  }
}

export const dataAnalytics = new DataAnalytics();
