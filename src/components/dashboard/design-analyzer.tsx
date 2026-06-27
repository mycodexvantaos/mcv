'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Sparkles, ShieldCheck, AlertCircle, Info, Cpu } from 'lucide-react';
import { designDocsContent } from '@/lib/design-docs';
import { summarizeResearchData } from '@/ai/client-stubs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { performNativeAnalysis, type NativeAnalysisResult } from '@/lib/architecture-engine';
import { useConnectivity } from '@/lib/connectivity-manager';

export function DesignAnalyzer() {
  const [docsContent, setDocsContent] = useState(designDocsContent);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [nativeAnalysis, setNativeAnalysis] = useState<NativeAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { mode } = useConnectivity();
  const isOffline = mode === 'native';

  const handleAnalyze = async () => {
    setIsLoading(true);
    setAiAnalysis('');
    setNativeAnalysis(null);

    // 始終執行原生分析作為基礎
    const localResult = performNativeAnalysis(docsContent);

    if (isOffline) {
      // 離線模式：僅使用原生引擎
      setTimeout(() => {
        setNativeAnalysis(localResult);
        setIsLoading(false);
      }, 1500); // 模擬分析耗時
    } else {
      // 在線模式：嘗試 AI 分析
      try {
        const result = await summarizeResearchData({ researchData: docsContent });
        setAiAnalysis(result.summary);
        setNativeAnalysis(localResult); // 同時顯示原生指標
      } catch (error) {
        console.error('AI Analysis failed, falling back to native:', error);
        setNativeAnalysis(localResult);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="p-4 border-b border-border bg-card/40 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider flex items-center gap-2">
          <Cpu className="h-4 w-4 text-primary" />
          架構設計分析儀
        </h2>
        <Badge
          variant="outline"
          className={
            isOffline ? 'text-yellow-500 border-yellow-500/20' : 'text-accent border-accent/20'
          }
        >
          {isOffline ? 'NATIVE ENGINE ACTIVE' : 'AI HYBRID MODE'}
        </Badge>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          <Card className="bg-card/30 border-border/50">
            <CardHeader className="p-4">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Architecture Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <Textarea
                placeholder="Paste architecture documents..."
                className="h-48 text-[10px] font-code bg-background/50"
                value={docsContent}
                onChange={(e) => setDocsContent(e.target.value)}
              />
            </CardContent>
          </Card>

          <Button
            onClick={handleAnalyze}
            disabled={isLoading || !docsContent}
            className="w-full h-10 gap-2 font-bold text-[10px] uppercase primary-glow"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isOffline ? (
              <ShieldCheck className="h-4 w-4" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {isOffline ? '執行原生專家審查 (Offline)' : '啟動 AI 混合架構分析'}
          </Button>

          {isLoading && (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          )}

          {!isLoading && nativeAnalysis && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* 原生分析評分 */}
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-bold uppercase flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      架構健康評分: {nativeAnalysis.score}/100
                    </CardTitle>
                    <Badge className="text-[8px] bg-primary/20 text-primary border-none">
                      NATIVE EXPERT
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-[11px] text-foreground leading-relaxed italic border-l-2 border-primary pl-3 my-2">
                    "{nativeAnalysis.summary}"
                  </p>
                </CardContent>
              </Card>

              {/* 結構化區塊 */}
              {nativeAnalysis.sections.map((section, i) => (
                <Card key={i} className="bg-card/50 border-border/50 overflow-hidden">
                  <div
                    className={`h-1 w-full ${
                      section.status === 'pass'
                        ? 'bg-accent'
                        : section.status === 'warning'
                          ? 'bg-yellow-500'
                          : 'bg-blue-500'
                    }`}
                  />
                  <CardHeader className="p-3">
                    <CardTitle className="text-[10px] font-bold uppercase flex items-center gap-2">
                      {section.status === 'pass' && <ShieldCheck className="h-3 w-3 text-accent" />}
                      {section.status === 'warning' && (
                        <AlertCircle className="h-3 w-3 text-yellow-500" />
                      )}
                      {section.status === 'info' && <Info className="h-3 w-3 text-blue-500" />}
                      {section.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 space-y-1">
                    {section.content.map((line, j) => (
                      <p key={j} className="text-[10px] text-muted-foreground">
                        {line}
                      </p>
                    ))}
                  </CardContent>
                </Card>
              ))}

              {/* AI 深度摘要 (如有) */}
              {aiAnalysis && (
                <Card className="bg-accent/5 border-accent/20 border-l-4">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-xs font-bold uppercase flex items-center gap-2 text-accent">
                      <Sparkles className="h-4 w-4" />
                      AI 深度洞察
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 text-[10px] text-muted-foreground leading-relaxed">
                    {aiAnalysis}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
