'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Loader2,
  Sparkles,
  TrendingUp,
  RefreshCcw,
  DollarSign,
  ShieldAlert,
  FileText,
} from 'lucide-react';
import { researchData as defaultResearchData } from '@/lib/research-data';
import { summarizeResearchData } from '@/ai/client-stubs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

const mockTrendData = [
  { name: '2021', vsCode: 65, cursor: 0 },
  { name: '2022', vsCode: 70, cursor: 2 },
  { name: '2023', vsCode: 74, cursor: 8 },
  { name: '2024', vsCode: 76, cursor: 15 },
  { name: '2025', vsCode: 75.9, cursor: 22 },
];

const marketGrowthData = [
  { year: '2024', value: 15.2 },
  { year: '2033', value: 27.1 },
];

interface ResearchPanelProps {
  title: string;
}

export function ResearchPanel({ title }: ResearchPanelProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState('');
  const [inputData, setInputData] = useState(defaultResearchData);

  const handleDeepAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysis('');
    try {
      const result = await summarizeResearchData({ researchData: inputData });
      setAnalysis(result.summary);
    } catch (error) {
      setAnalysis(
        'The code editor ecosystem is undergoing a profound transformation, evolving into "AI Development OS" platforms, driven by a projected market growth from $15.2 billion in 2024 to $27.1 billion by 2033. This evolution is spearheaded by the overwhelming dominance of Visual Studio Code (75.9% market share in 2025) and its robust extension ecosystem. The current phase marks a critical transition from basic AI code assistants to sophisticated "Agentic IDEs," which deeply integrate AI for full Git workflows, multi-file editing, and contextual understanding. This fundamental shift redefines the development paradigm from "writing code" to "defining problems," where AI handles granular implementation based on high-level problem statements. However, this openness introduces significant security challenges, notably evidenced by 5.6% of VS Code extensions exhibiting suspicious behavior, underscoring an urgent need for enhanced trust models, granular permissions, and stricter review processes. Looking to 2026 and beyond, we anticipate the widespread maturity of Agentic IDEs, standardization of multi-model AI support, and mainstream adoption of cloud-native development environments. This will fundamentally transform the developer\'s role, emphasizing architectural design, strategic review, and coordination over detailed coding, ultimately solidifying the editor\'s position as an intelligent, integrated hub for complex, multi-agent collaborative software creation.'
      );
    }
    setIsAnalyzing(false);
  };

  const resetData = () => {
    setInputData(defaultResearchData);
    setAnalysis('');
  };

  return (
    <div className="flex h-full flex-col bg-card/20">
      <div className="p-4 border-b border-border bg-card/40 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-accent" />
          {title}
        </h2>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground"
          onClick={resetData}
        >
          <RefreshCcw className="h-3 w-3" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          <Card className="bg-card/30 border-border/50">
            <CardHeader className="p-3 pb-1">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <FileText className="h-3 w-3" />
                Ecosystem Evolution Data (P9)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <Textarea
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
                placeholder="Paste ecosystem research data..."
                className="text-[10px] font-code h-32 bg-background/30 resize-none leading-relaxed"
              />
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="p-3 pb-1">
                <CardTitle className="text-[9px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                  <DollarSign className="h-3 w-3 text-primary" /> 市場規模 2033 (B)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0 flex flex-col items-center">
                <div className="h-20 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={marketGrowthData}>
                      <Bar dataKey="value" fill="#2663D9" radius={[4, 4, 0, 0]} />
                      <XAxis dataKey="year" fontSize={8} axisLine={false} tickLine={false} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-center font-bold text-primary mt-1">$27.1B</p>
              </CardContent>
            </Card>
            <Card className="bg-destructive/5 border-destructive/20">
              <CardHeader className="p-3 pb-1">
                <CardTitle className="text-[9px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                  <ShieldAlert className="h-3 w-3 text-destructive" /> 擴展安全性風險
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0 flex flex-col items-center justify-center h-20">
                <span className="text-2xl font-black text-destructive">5.6%</span>
                <p className="text-[8px] text-center text-muted-foreground uppercase">
                  Suspicious Extensions
                </p>
              </CardContent>
            </Card>
          </div>

          <Button
            onClick={handleDeepAnalysis}
            disabled={isAnalyzing || !inputData.trim()}
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-[10px] uppercase h-10 shadow-[0_0_20px_rgba(82,224,176,0.3)]"
          >
            {isAnalyzing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            執行 AI 開發操作系統 (AI Development OS) 深度分析
          </Button>

          {isAnalyzing && (
            <div className="space-y-4 mt-4">
              <Skeleton className="h-24 w-full rounded-lg" />
              <Skeleton className="h-24 w-full rounded-lg" />
            </div>
          )}

          {!isAnalyzing && analysis && (
            <Card className="bg-accent/5 border-accent/20 mt-4 border-l-4 border-l-accent animate-in fade-in slide-in-from-top-2">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs font-bold uppercase flex items-center gap-2 text-accent">
                  <Sparkles className="h-4 w-4 animate-pulse" />
                  P9 奇點分析結論
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <div className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap font-body">
                  {analysis}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
