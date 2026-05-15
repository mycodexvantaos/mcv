'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Sparkles } from 'lucide-react';
import { researchData as defaultResearchData } from '@/lib/research-data';
import { summarizeResearchData } from '@/ai/flows/ai-research-data-summarization';
import { Skeleton } from '@/components/ui/skeleton';

interface ResearchPanelProps {
  title: string;
}

export function ResearchPanel({ title }: ResearchPanelProps) {
  const [researchData, setResearchData] = useState(defaultResearchData);
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSummarize = async () => {
    setIsLoading(true);
    setSummary('');
    try {
      const result = await summarizeResearchData({ researchData });
      setSummary(result.summary);
    } catch (error) {
      console.error('Error summarizing research data:', error);
      setSummary('Failed to generate summary. Please try again.');
    }
    setIsLoading(false);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="p-4 border-b border-border">
        <h2 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">
          {title}
        </h2>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">Research Data Input</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Paste your research data here..."
                className="h-64 text-xs"
                value={researchData}
                onChange={(e) => setResearchData(e.target.value)}
              />
            </CardContent>
          </Card>

          <Button
            onClick={handleSummarize}
            disabled={isLoading || !researchData}
            className="w-full"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Generate Summary
          </Button>

          {isLoading && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  AI Generated Summary
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

          {!isLoading && summary && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  AI Generated Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-foreground whitespace-pre-wrap">{summary}</div>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
