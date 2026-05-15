'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Sparkles } from 'lucide-react';
import { designDocsContent } from '@/lib/design-docs';
import { summarizeResearchData } from '@/ai/flows/ai-research-data-summarization';
import { Skeleton } from '@/components/ui/skeleton';

export function DesignAnalyzer() {
  const [docsContent, setDocsContent] = useState(designDocsContent);
  const [analysis, setAnalysis] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyze = async () => {
    setIsLoading(true);
    setAnalysis('');
    try {
      // We can reuse the research summarization flow for this purpose.
      const result = await summarizeResearchData({ researchData: docsContent });
      setAnalysis(result.summary);
    } catch (error) {
      console.error('Error analyzing design documents:', error);
      setAnalysis('Failed to generate analysis. Please try again.');
    }
    setIsLoading(false);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="p-4 border-b border-border">
        <h2 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">
          Design Analyzer
        </h2>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">Architecture Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Paste your architecture documents here..."
                className="h-64 text-xs"
                value={docsContent}
                onChange={(e) => setDocsContent(e.target.value)}
              />
            </CardContent>
          </Card>

          <Button onClick={handleAnalyze} disabled={isLoading || !docsContent} className="w-full">
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Analyze Design
          </Button>

          {isLoading && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  AI Generated Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          )}

          {!isLoading && analysis && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  AI Generated Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-foreground whitespace-pre-wrap">{analysis}</div>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
