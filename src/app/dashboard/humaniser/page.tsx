'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Loader2,
  ScanSearch,
  Wand2,
  FileText,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Copy,
  Download,
  RefreshCw,
} from 'lucide-react';
import { HighlightedText } from '@/components/humaniser/highlighted-text';
import { DetectionResult } from '@/components/humaniser/detection-result';
import { RewriteComparison } from '@/components/humaniser/rewrite-comparison';
import { ScoreGauge } from '@/components/humaniser/score-gauge';

interface DetectionData {
  id: string;
  label: string;
  confidence: number;
  aiScore: number;
  humanScore: number;
  sentences: Array<{
    text: string;
    index: number;
    label: string;
    confidence: number;
    aiScore: number;
    humanScore: number;
    explanation: string;
  }>;
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
  explanation: string;
  processingTimeMs: number;
}

interface HumaniserData {
  id: string;
  humanisedText: string;
  sentenceRewrites: Array<{
    index: number;
    original: string;
    rewritten: string;
    originalAiScore: number;
    newAiScore: number;
    improvement: number;
    changes: string[];
  }>;
  changeSummary: {
    sentencesRewritten: number;
    sentencesUnchanged: number;
    avgScoreImprovement: number;
    overallScoreChange: { before: number; after: number };
    changeCategories: Array<{ category: string; count: number; examples: string[] }>;
  };
  comparison: {
    originalHighlighted: Array<{ text: string; label: string; confidence: number; index: number }>;
    humanisedHighlighted: Array<{ text: string; label: string; confidence: number; index: number }>;
    diffs: Array<{ type: string; original?: string; humanised?: string; index: number }>;
  };
  processingTimeMs: number;
}

export default function HumaniserPage() {
  const [inputText, setInputText] = useState('');
  const [style, setStyle] = useState('neutral');
  const [useLLM, setUseLLM] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [humanising, setHumanising] = useState(false);
  const [detectionData, setDetectionData] = useState<DetectionData | null>(null);
  const [humaniserData, setHumaniserData] = useState<HumaniserData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('detect');

  const handleDetect = useCallback(async () => {
    if (!inputText.trim()) return;
    setDetecting(true);
    setError(null);
    setDetectionData(null);
    setHumaniserData(null);

    try {
      const res = await fetch('/api/humaniser/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText, source: 'text', useLLM }),
      });

      if (!res.ok) {
        const err: { error?: string } = await res.json();
        throw new Error(err.error || 'Detection failed');
      }

      const data: DetectionData = await res.json();
      setDetectionData(data);
      setActiveTab('results');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setDetecting(false);
    }
  }, [inputText, useLLM]);

  const handleHumanise = useCallback(async () => {
    if (!detectionData) return;
    setHumanising(true);
    setError(null);

    try {
      const res = await fetch('/api/humaniser/humanise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText,
          detectionResult: detectionData,
          style,
          useLLM,
        }),
      });

      if (!res.ok) {
        const err: { error?: string } = await res.json();
        throw new Error(err.error || 'Humanisation failed');
      }

      const data: HumaniserData = await res.json();
      setHumaniserData(data);
      setActiveTab('comparison');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setHumanising(false);
    }
  }, [inputText, detectionData, style, useLLM]);

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
  }, []);

  const labelColor = (label: string) => {
    switch (label) {
      case 'ai':
        return 'destructive';
      case 'human':
        return 'default';
      case 'mixed':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const labelIcon = (label: string) => {
    switch (label) {
      case 'ai':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'human':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'mixed':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <ScanSearch className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-headline">AI Humaniser</h1>
            <p className="text-sm text-muted-foreground">
              Detect AI-generated content and rewrite to sound more natural
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch id="llm-mode" checked={useLLM} onCheckedChange={setUseLLM} />
            <Label htmlFor="llm-mode" className="text-xs text-muted-foreground">
              LLM Enhanced
            </Label>
          </div>
          <Badge variant="outline" className="text-xs">
            {useLLM ? 'Hybrid Mode' : 'Native Mode'}
          </Badge>
        </div>
      </div>

      {/* Input Area */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Input Text</CardTitle>
          <CardDescription>
            Paste or type the text you want to analyze for AI-generated content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Enter text to analyze for AI-generated content..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="min-h-[180px] font-mono text-sm"
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">Style</Label>
                <Select value={style} onValueChange={setStyle}>
                  <SelectTrigger className="w-[160px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="neutral">Neutral</SelectItem>
                    <SelectItem value="conversational">Conversational</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="academic">Academic</SelectItem>
                    <SelectItem value="creative">Creative</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <span className="text-xs text-muted-foreground">
                {inputText.length.toLocaleString()} characters
              </span>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleDetect} disabled={detecting || !inputText.trim()} size="sm">
                {detecting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ScanSearch className="mr-2 h-4 w-4" />
                )}
                Detect
              </Button>
              <Button
                onClick={handleHumanise}
                disabled={humanising || !detectionData}
                variant="secondary"
                size="sm"
              >
                {humanising ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="mr-2 h-4 w-4" />
                )}
                Humanise
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-4">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {(detectionData || humaniserData) && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="detect">
              <ScanSearch className="mr-2 h-4 w-4" />
              Detection
            </TabsTrigger>
            <TabsTrigger value="results" disabled={!detectionData}>
              <BarChart3 className="mr-2 h-4 w-4" />
              Results
            </TabsTrigger>
            <TabsTrigger value="comparison" disabled={!humaniserData}>
              <FileText className="mr-2 h-4 w-4" />
              Comparison
            </TabsTrigger>
          </TabsList>

          {/* Detection Tab */}
          <TabsContent value="detect" className="space-y-4">
            {detectionData && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-4 text-center">
                    <ScoreGauge
                      score={detectionData.aiScore}
                      label="AI Probability"
                      color="#ef4444"
                    />
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <ScoreGauge
                      score={detectionData.humanScore}
                      label="Human Probability"
                      color="#22c55e"
                    />
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Verdict</span>
                      {labelIcon(detectionData.label)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Confidence</span>
                      <span className="text-sm font-medium">
                        {(detectionData.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Sentences</span>
                      <span className="text-sm font-medium">
                        {detectionData.stats.totalSentences}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Processing</span>
                      <span className="text-sm font-medium">
                        {detectionData.processingTimeMs}ms
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="space-y-4">
            {detectionData && (
              <>
                <DetectionResult detection={detectionData} />
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Highlighted Text</CardTitle>
                    <CardDescription>
                      AI-flagged sentences shown in red, human-like in green
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <HighlightedText sentences={detectionData.sentences} />
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Comparison Tab */}
          <TabsContent value="comparison" className="space-y-4">
            {humaniserData && (
              <RewriteComparison
                originalText={inputText}
                humanisedText={humaniserData.humanisedText}
                comparison={humaniserData.comparison}
                changeSummary={humaniserData.changeSummary}
                onCopyOriginal={() => handleCopy(inputText)}
                onCopyHumanised={() => handleCopy(humaniserData.humanisedText)}
              />
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
