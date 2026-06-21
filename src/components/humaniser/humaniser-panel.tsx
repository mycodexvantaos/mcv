'use client';

/**
 * @fileoverview Humaniser Panel Component
 *
 * Compact panel for integration into the AI assistant sidebar.
 * Provides quick detection and humanisation functionality.
 */

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScanSearch, Wand2, Loader2, CheckCircle2, XCircle } from 'lucide-react';

export function HumaniserPanel() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    label: string;
    aiScore: number;
    confidence: number;
  } | null>(null);

  const handleDetect = useCallback(async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/humaniser/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, source: 'text' }),
      });
      const data = await res.json();
      setResult({
        label: data.label,
        aiScore: data.aiScore,
        confidence: data.confidence,
      });
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [text]);

  const handleHumanise = useCallback(async () => {
    if (!text.trim() || !result) return;
    setLoading(true);
    try {
      const detectRes = await fetch('/api/humaniser/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, source: 'text' }),
      });
      const detection = await detectRes.json();

      const res = await fetch('/api/humaniser/humanise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, detectionResult: detection, style: 'neutral' }),
      });
      const data = await res.json();
      setText(data.humanisedText);
      setResult({
        label: data.updatedDetection?.label || 'human',
        aiScore: data.updatedDetection?.aiScore || 0,
        confidence: data.updatedDetection?.confidence || 0,
      });
    } catch {
      // Keep existing text on error
    } finally {
      setLoading(false);
    }
  }, [text, result]);

  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="px-3 pt-3 pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <ScanSearch className="h-4 w-4" />
          AI Humaniser
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-3 space-y-3">
        <Textarea
          placeholder="Paste text to analyze..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-h-[100px] text-xs"
        />

        {result && (
          <div className="flex items-center gap-2">
            {result.label === 'ai' ? (
              <XCircle className="h-4 w-4 text-red-500" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            )}
            <Badge
              variant={result.label === 'ai' ? 'destructive' : 'default'}
              className="text-[10px]"
            >
              {result.label.toUpperCase()} {(result.aiScore * 100).toFixed(0)}%
            </Badge>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleDetect}
            disabled={loading || !text.trim()}
            size="sm"
            className="flex-1 h-7 text-xs"
          >
            {loading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <ScanSearch className="h-3 w-3 mr-1" />
            )}
            Detect
          </Button>
          <Button
            onClick={handleHumanise}
            disabled={loading || !result}
            size="sm"
            variant="secondary"
            className="flex-1 h-7 text-xs"
          >
            {loading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Wand2 className="h-3 w-3 mr-1" />
            )}
            Humanise
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
