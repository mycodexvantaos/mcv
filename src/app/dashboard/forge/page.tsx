'use client';

import { useState } from 'react';
import { forgeDynamicTool, type ToolForgeOutput } from '@/ai/client-stubs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Zap,
  Loader2,
  Terminal,
  ShieldCheck,
  Cpu,
  Code,
  History,
  AlertCircle,
  Target,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ToolForgePage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [env, setEnv] = useState('');
  const [goal, setGoal] = useState('');
  const [result, setResult] = useState<ToolForgeOutput | null>(null);
  const [correctionLog, setCorrectionLog] = useState<string[]>([]);

  const handleForge = async (errorContext?: string) => {
    setLoading(true);
    try {
      const output = await forgeDynamicTool({
        environmentDescription: env,
        taskGoal: goal,
        previousErrors: errorContext,
      });
      setResult(output);
      if (errorContext) {
        setCorrectionLog((prev) => [
          `FIXED: Error resolved via Self-Correction loop at ${new Date().toLocaleTimeString()}`,
          ...prev,
        ]);
        toast({
          title: 'Self-Correction Successful',
          description: 'The agent has healed the tool code.',
        });
      }
    } catch (e) {
      console.error(e);
      toast({
        variant: 'destructive',
        title: 'Forge Failure',
        description: 'Critical error in code generation.',
      });
    } finally {
      setLoading(false);
    }
  };

  const simulateExecutionError = () => {
    toast({
      variant: 'destructive',
      title: 'Execution Error',
      description: 'Syntax error detected in generated tool. Triggering Self-Correction loop...',
    });
    handleForge("SyntaxError: 'NoneType' object has no attribute 'get_api_key' at line 12");
  };

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto scanline">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border/20 pb-10">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Cpu className="h-5 w-5" />
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] font-mono">
              Month 2: Zero-Shot Tool Creation
            </span>
          </div>
          <h1 className="text-5xl font-bold font-headline tracking-tighter uppercase leading-tight">
            Tool <span className="text-primary italic">Forge</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl font-light">
            Autonomous reverse engineering and self-healing code generation. AI builds its own hands
            to operate novel environments.
          </p>
        </div>
      </div>

      {!result ? (
        <Card className="border-border/40 bg-card/30">
          <CardHeader>
            <CardTitle className="text-lg">Forge Configuration</CardTitle>
            <CardDescription>
              Specify the unknown environment and the goal to initiate zero-shot forging.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Code className="h-3 w-3" /> Novel Environment (API Docs / UI Spec)
              </label>
              <Textarea
                placeholder="Paste API documentation, DOM structure, or system behavioral description..."
                className="bg-background/50 border-border/40 min-h-[200px] font-mono text-xs leading-relaxed"
                value={env}
                onChange={(e) => setEnv(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Target className="h-3 w-3" /> Execution Goal
              </label>
              <Textarea
                placeholder="What action should the AI perform in this environment?"
                className="bg-background/50 border-border/40 h-24"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
              />
            </div>
            <Button
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-14 font-bold uppercase tracking-widest text-[11px]"
              onClick={() => handleForge()}
              disabled={loading || !env || !goal}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Zap className="mr-2 h-4 w-4" />
              )}
              <span>FORGE EPHEMERAL TOOL</span>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-8 lg:grid-cols-2 animate-in fade-in duration-500">
          <div className="space-y-8 flex flex-col">
            <Card className="border-border/40 bg-card/30 flex flex-col h-full">
              <CardHeader className="flex flex-row items-center justify-between bg-white/5 border-b border-border/10">
                <div className="space-y-1">
                  <CardTitle className="text-xl font-headline flex items-center gap-2">
                    <Terminal className="h-5 w-5 text-primary" />
                    Ephemeral Tool Source
                  </CardTitle>
                  <CardDescription>
                    Sandboxed Python script generated for single-use execution.
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-[9px] uppercase font-bold h-8"
                    onClick={simulateExecutionError}
                  >
                    <AlertCircle className="mr-1 h-3 w-3" /> Fail & Self-Heal
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-[9px] uppercase font-bold h-8"
                    onClick={() => setResult(null)}
                  >
                    Reset
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                <div className="p-6 bg-black/60 h-full font-mono text-[11px] leading-relaxed overflow-auto max-h-[600px] border-t border-border/20">
                  <pre className="text-primary/90">{result.generatedCode}</pre>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/40 bg-card/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-muted-foreground">
                  <History className="h-4 w-4" /> Self-Correction Log
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {correctionLog.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground italic">
                    No healing actions required. Initial generation valid.
                  </p>
                ) : (
                  correctionLog.map((log, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-[10px] font-mono text-accent"
                    >
                      <Zap className="h-3 w-3 shrink-0" />
                      <span>{log}</span>
                    </div>
                  ))
                )}
                <div className="mt-4 p-4 rounded-lg bg-background/50 border border-border/40 italic text-xs text-muted-foreground">
                  {result.selfCorrectionLog}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <Card className="border-border/40 bg-card/30">
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-primary">
                  <Code className="h-4 w-4" /> Reverse Engineering Report
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground/80 leading-relaxed font-light italic">
                  {result.reverseEngineeringReport}
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-primary">
                  <ShieldCheck className="h-4 w-4" /> Automated Safety Audit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4 p-5 rounded-2xl bg-background/50 border border-primary/20">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-medium leading-relaxed italic">{result.safetyAudit}</p>
                </div>
              </CardContent>
            </Card>

            <div className="p-8 rounded-3xl bg-sidebar-background border border-border/40 text-center space-y-4">
              <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground/60">
                Execution Status
              </p>
              <div className="flex flex-col items-center gap-2">
                <Badge className="bg-primary text-primary-foreground font-mono text-[10px] px-6 py-2 tracking-widest">
                  SANDBOX_READY
                </Badge>
                <p className="text-[9px] text-muted-foreground font-mono uppercase">
                  Target: Ephemeral_Docker_Container_X99
                </p>
              </div>
              <Button className="w-full h-12 bg-accent text-accent-foreground font-bold uppercase tracking-widest text-[11px]">
                INITIATE SINGLE-USE DEPLOYMENT
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
