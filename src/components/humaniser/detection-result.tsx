'use client';

/**
 * @fileoverview Detection Result Component
 *
 * Displays detailed detection results including per-sentence
 * breakdown, statistics, and summary cards.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, XCircle, AlertTriangle, HelpCircle } from 'lucide-react';

interface DetectionResultProps {
  detection: {
    id: string;
    label: string;
    confidence: number;
    aiScore: number;
    humanScore: number;
    explanation: string;
    stats: {
      totalSentences: number;
      aiSentences: number;
      humanSentences: number;
      uncertainSentences: number;
      avgConfidence: number;
      maxAiScore: number;
      minAiScore: number;
      stdDevAiScore: number;
    };
    sentences: Array<{
      text: string;
      index: number;
      label: string;
      confidence: number;
      aiScore: number;
      humanScore: number;
      explanation: string;
    }>;
  };
}

export function DetectionResult({ detection }: DetectionResultProps) {
  const { stats, sentences } = detection;

  const VerdictIcon = () => {
    switch (detection.label) {
      case 'ai':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'human':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'mixed':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <HelpCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-3 pb-3 text-center">
            <p className="text-2xl font-bold text-red-500">{stats.aiSentences}</p>
            <p className="text-xs text-muted-foreground">AI Sentences</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-3 text-center">
            <p className="text-2xl font-bold text-green-500">{stats.humanSentences}</p>
            <p className="text-xs text-muted-foreground">Human Sentences</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-3 text-center">
            <p className="text-2xl font-bold text-yellow-500">{stats.uncertainSentences}</p>
            <p className="text-xs text-muted-foreground">Uncertain</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-3 text-center">
            <p className="text-2xl font-bold">{stats.totalSentences}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
      </div>

      {/* Verdict */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <VerdictIcon />
            <div className="flex-1">
              <p className="text-sm font-medium">{detection.explanation}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-muted-foreground">AI Score</span>
                <Progress value={detection.aiScore * 100} className="flex-1 h-2" />
                <span className="text-xs font-mono">{(detection.aiScore * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Per-Sentence Breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Sentence Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {sentences.map((s) => (
              <div
                key={s.index}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50"
              >
                <span className="text-xs text-muted-foreground w-6 text-right">{s.index + 1}</span>
                <Badge
                  variant={
                    s.label === 'ai' ? 'destructive' : s.label === 'human' ? 'default' : 'secondary'
                  }
                  className="text-[10px] min-w-[52px] justify-center"
                >
                  {s.label.toUpperCase()}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{s.text}</p>
                </div>
                <span className="text-xs font-mono text-muted-foreground">
                  {(s.aiScore * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
