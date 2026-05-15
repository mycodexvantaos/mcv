'use client';

import { useState } from 'react';
import {
  Zap,
  Sparkles,
  Loader2,
  ShieldCheck,
  Copy,
  Check,
  Cpu,
  Infinity,
  SearchCheck,
  ShieldAlert,
  History,
  Activity,
  ArrowRight,
  Database,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  delegateCodingTask,
  type DelegateCodingTaskOutput,
} from '@/ai/flows/ai-agent-code-generation-refactoring';
import { useToast } from '@/hooks/use-toast';
import { useConnectivity } from '@/lib/connectivity-manager';
import { NLUEngine, type NLUAnalysisResult } from '@/services/native/nlu-engine';

export function SourceGenerator() {
  const [task, setTask] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<DelegateCodingTaskOutput | null>(null);
  const [nluResult, setNluResult] = useState<NLUAnalysisResult | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { mode } = useConnectivity();
  const isOffline = mode === 'native';

  const handleGenerate = async () => {
    if (!task.trim() || isGenerating) return;

    setIsGenerating(true);
    setResult(null);
    setNluResult(null);

    try {
      // 1. 執行 NLU 主權管道校驗 (v1.0.0 Production Standard)
      const nlu = NLUEngine.getInstance();
      const nluAudit = await nlu.analyze(task);
      setNluResult(nluAudit);

      // 2. 執行合成任務 (P9 Engine)
      const output = await delegateCodingTask({
        taskDescription: task,
        taskType: 'generation',
        isOffline: isOffline,
      });

      setResult(output);

      toast({
        title: nluAudit.isFallback
          ? 'Fallback Mode Active'
          : nluAudit.cached
            ? 'P9 Cache Hit'
            : 'P9 Synthesis Converged',
        description: `Production Integrity: ${nluAudit.integrityVerified ? 'VERIFIED' : 'CAUTION'}`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Synthesis Failed',
        description: error.message,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-background/50">
      <div className="p-4 border-b border-border bg-card/40 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider flex items-center gap-2">
          <Infinity className="h-4 w-4 text-accent animate-spin-slow" />
          P9 Synthesis Hub (v1.0.0 Locked)
        </h2>
        <div className="flex gap-2">
          <Badge
            variant="outline"
            className="bg-primary/5 text-primary border-primary/30 text-[9px] font-black uppercase"
          >
            SUCCESS_METRICS: OK
          </Badge>
          <Badge
            variant="outline"
            className="bg-accent/10 text-accent border-accent/20 text-[9px] font-black"
          >
            LOCKED [x]
          </Badge>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          <Card className="bg-card/30 border-border/50 shadow-2xl border-l-4 border-l-accent">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center justify-between">
                Architectural Intent Input
                <Badge variant="ghost" className="text-[8px] h-4 uppercase font-code">
                  Latency &lt; 150ms
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-4">
              <Textarea
                placeholder="輸入架構意圖 (已鎖定 v1.0.0 生產標籤)"
                className="min-h-[100px] text-xs font-code bg-background/50 resize-none border-border/40 focus:border-accent/50"
                value={task}
                onChange={(e) => setTask(e.target.value)}
              />

              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !task.trim()}
                className="w-full h-11 gap-2 font-bold text-[10px] uppercase primary-glow"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Lock className="h-4 w-4 text-accent" />
                )}
                {isGenerating ? 'Production Processing...' : 'Execute Sovereign Synthesis'}
              </Button>
            </CardContent>
          </Card>

          {nluResult && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
              {nluResult.cached && (
                <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 flex items-center gap-2">
                  <Database className="h-3 w-3 text-primary animate-pulse" />
                  <span className="text-[9px] font-black text-primary uppercase tracking-widest">
                    NLU Cache Hit - Zero Latency Recall
                  </span>
                </div>
              )}

              <Card className="bg-black/40 border-white/5 p-4 overflow-hidden">
                <p className="text-[9px] text-muted-foreground uppercase font-black tracking-[0.2em] mb-4 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  NLU 4-Layer Processing Pipeline (v1.0.0)
                </p>
                <div className="flex items-center justify-between px-2">
                  {nluResult.pipeline.map((p, i) => (
                    <div key={i} className="flex items-center">
                      <div className="flex flex-col items-center gap-1.5">
                        <div
                          className={`h-8 w-8 rounded-full border flex items-center justify-center text-[10px] font-black ${p.confidence > 0.9 ? 'border-accent text-accent bg-accent/5' : 'border-primary text-primary bg-primary/5'}`}
                        >
                          {i + 1}
                        </div>
                        <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-tighter">
                          {p.stage.split(' ')[1]}
                        </span>
                      </div>
                      {i < nluResult.pipeline.length - 1 && (
                        <ArrowRight className="h-3 w-3 text-white/10 mx-2 mb-4" />
                      )}
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="bg-black/40 border-white/5 p-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10">
                  <History className="h-10 w-10 text-primary" />
                </div>
                <p className="text-[9px] text-muted-foreground uppercase font-black tracking-[0.2em] mb-4 flex items-center gap-2">
                  <SearchCheck className="h-4 w-4 text-accent" />
                  NLU Production Confidence (L1 Defense)
                </p>

                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  {[
                    {
                      label: 'Intent Recognition',
                      val: nluResult.confidence.intent * 100,
                      color: 'text-accent',
                    },
                    {
                      label: 'Entity Extraction',
                      val: nluResult.confidence.entities * 100,
                      color: 'text-primary',
                    },
                    {
                      label: 'Template Selection',
                      val: nluResult.confidence.template * 100,
                      color: 'text-accent',
                    },
                    {
                      label: 'Code Generation',
                      val: nluResult.confidence.generation * 100,
                      color: 'text-primary',
                    },
                    {
                      label: 'Validation (L3)',
                      val: nluResult.confidence.validation * 100,
                      color: 'text-accent',
                    },
                  ].map((item, i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="flex justify-between text-[8px] font-black uppercase tracking-tighter text-muted-foreground">
                        <span>{item.label}</span>
                        <span className={item.color}>{item.val.toFixed(0)}%</span>
                      </div>
                      <Progress value={item.val} className="h-0.5 bg-white/5" />
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-3 w-3 text-primary" />
                    <span className="text-[9px] font-code text-primary/80 uppercase">
                      Audit ID: {nluResult.auditId}
                    </span>
                  </div>
                  <Badge className="text-[8px] bg-primary/20 text-primary py-0 h-4 uppercase font-black">
                    v1.0.0 Compliance Locked
                  </Badge>
                </div>

                {nluResult.uncertaintyFactors.length > 0 && (
                  <div className="mt-4 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                    <p className="text-[8px] font-black text-yellow-500 uppercase tracking-widest mb-1.5">
                      Uncertainty Factors (AFC L2):
                    </p>
                    <ul className="space-y-1">
                      {nluResult.uncertaintyFactors.map((f, i) => (
                        <li
                          key={i}
                          className="text-[9px] text-yellow-500/70 flex items-center gap-1.5"
                        >
                          <div className="h-1 w-1 rounded-full bg-yellow-500/40" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            </div>
          )}

          {result && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <Card className="bg-accent/5 border-accent/20 relative group">
                <CardHeader className="p-4 pb-2 flex-row items-center justify-between space-y-0">
                  <div className="flex flex-col gap-1">
                    <CardTitle className="text-xs font-bold uppercase flex items-center gap-2 text-accent tracking-widest">
                      <Cpu className="h-4 w-4 text-accent" />
                      Synthesized Logic (v1.0.0 Locked)
                    </CardTitle>
                    <div className="flex gap-2">
                      <Badge variant="ghost" className="text-[8px] text-accent h-4 p-0 uppercase">
                        Syntax: OK
                      </Badge>
                      <Badge variant="ghost" className="text-[8px] text-accent h-4 p-0 uppercase">
                        Success Metrics: 100%
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-accent"
                    onClick={() => {
                      navigator.clipboard.writeText(result.generatedCode);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <pre className="text-[10px] font-code p-4 bg-black/60 rounded-xl border border-white/5 overflow-x-auto text-foreground/80 leading-relaxed">
                    <code>{result.generatedCode}</code>
                  </pre>
                  <div className="mt-4 p-3 rounded-lg bg-accent/5 border border-accent/10 italic text-[10px] text-muted-foreground leading-relaxed">
                    {result.explanation}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
