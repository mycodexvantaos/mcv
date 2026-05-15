'use client';

import { useState } from 'react';
import {
  validateAndSuggestChecklists,
  ValidateAndSuggestChecklistsOutput,
} from '@/ai/flows/validate-and-suggest-checklists';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  ClipboardCheck,
  Loader2,
  Plus,
  AlertCircle,
  CheckCircle2,
  Shield,
  Wrench,
  GitPullRequest,
  Trash2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ChecklistsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fixingId, setFixingId] = useState<number | null>(null);
  const [result, setResult] = useState<ValidateAndSuggestChecklistsOutput | null>(null);

  const [customItems, setCustomItems] = useState([
    'All secrets must be stored in GitLab CI/CD protected variables',
    'Database migrations must be decoupled from app deployment',
    'Zero-downtime rollback strategy must be explicitly defined',
    'Internal traffic must be encrypted via mTLS',
  ]);

  const runValidation = async () => {
    setLoading(true);
    try {
      const output = await validateAndSuggestChecklists({
        architectureDefinition: 'Microservices using service mesh Linkerd.',
        ciCdPipelineConfig: 'stages: build, deploy. deploy: script: kubectl rollout restart',
        customChecklist: customItems,
      });
      setResult(output);
      toast({
        title: 'Policy Audit Complete',
        description: `Detected ${output.validationResults.filter((r) => r.status === 'VIOLATED').length} policy violations requiring intervention.`,
      });
    } catch (e) {
      console.error(e);
      toast({
        variant: 'destructive',
        title: 'Audit Failed',
        description: 'The policy engine encountered an internal error.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddToChecklist = (policy: string) => {
    if (customItems.includes(policy)) {
      toast({
        title: 'Policy Exists',
        description: 'This item is already active in your protocol.',
      });
      return;
    }
    setCustomItems((prev) => [...prev, policy]);
    toast({
      title: 'Protocol Enhanced',
      description: 'AI suggested policy has been successfully integrated into your active list.',
    });
  };

  const handleAutoFix = async (index: number, policy: string) => {
    setFixingId(index);
    // Simulate complex AI repair / MR generation
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setResult((prev) => {
      if (!prev) return null;
      const newResults = [...prev.validationResults];
      newResults[index] = {
        ...newResults[index],
        status: 'ADHERENT',
        details: `Auto-remediated: Successfully generated GitLab Merge Request #4021 to align with ${policy}.`,
      };
      return { ...prev, validationResults: newResults };
    });

    toast({
      title: 'Issue Remediated',
      description: `Sentinel has applied a temporary patch and drafted a permanent fix for: ${policy}`,
    });
    setFixingId(null);
  };

  const removeItem = (index: number) => {
    setCustomItems((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto scanline">
      <div className="flex items-center justify-between">
        <div className="flex flex-col space-y-1">
          <div className="flex items-center gap-2 text-primary">
            <Shield className="h-5 w-5" />
            <span className="text-[10px] font-bold uppercase tracking-[0.4em]">
              Sub-System: Policy Enforcement
            </span>
          </div>
          <h1 className="text-4xl font-bold font-headline tracking-tighter uppercase">
            零故障策略 (Zero-Failure Policy)
          </h1>
          <p className="text-muted-foreground font-light max-w-2xl">
            不只是審計，更是守護。自動檢測、自動提案並一鍵修復您的架構缺陷。
          </p>
        </div>
        <Button
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 h-12 uppercase tracking-widest text-[11px]"
          onClick={runValidation}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ClipboardCheck className="mr-2 h-4 w-4" />
          )}
          <span>啟動政策強制執行 (ENFORCE POLICIES)</span>
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <Card className="border-border/40 bg-card/20 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/10 bg-white/5">
            <div className="space-y-1">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary">
                活動策略清單 (Active Policies)
              </CardTitle>
              <CardDescription className="text-[10px] uppercase">
                Custom 'Zero-Failure' Protocol
              </CardDescription>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-2 pt-4">
            {customItems.length === 0 ? (
              <p className="text-center py-10 text-xs text-muted-foreground italic">
                No active policies defined.
              </p>
            ) : (
              customItems.map((item, i) => (
                <div
                  key={i}
                  className="flex items-start justify-between group p-3 rounded-lg border border-transparent hover:border-border/40 hover:bg-sidebar-background/50 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id={`check-${i}`}
                      defaultChecked
                      className="mt-0.5 border-primary/40 data-[state=checked]:bg-primary"
                    />
                    <label
                      htmlFor={`check-${i}`}
                      className="text-[11px] leading-relaxed text-muted-foreground cursor-pointer group-hover:text-foreground"
                    >
                      {item}
                    </label>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                    onClick={() => removeItem(i)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-8">
          {!result ? (
            <div className="h-full min-h-[500px] flex flex-col items-center justify-center border-2 border-dashed border-border/40 rounded-3xl space-y-6 bg-sidebar-background/20">
              <div className="h-20 w-20 rounded-full bg-primary/5 flex items-center justify-center border border-primary/10">
                <Shield className="h-10 w-10 text-primary/20 animate-pulse" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-muted-foreground font-medium tracking-widest uppercase text-xs">
                  策略引擎待命 (Policy Engine Idle)
                </p>
                <p className="text-[10px] text-muted-foreground/60 max-w-[280px]">
                  Run validation to check adherence against active zero-failure policies.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-primary flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4" /> 驗證結果與自動修復 (Validation & Auto-Fix)
                </h3>
                <div className="space-y-3">
                  {result.validationResults.map((res, i) => (
                    <Card
                      key={i}
                      className={`border-border/40 bg-card/30 overflow-hidden transition-all ${res.status === 'VIOLATED' ? 'border-l-4 border-l-destructive' : 'border-l-4 border-l-accent'}`}
                    >
                      <CardContent className="p-5 flex items-start gap-5">
                        <div className="mt-1">
                          {res.status === 'ADHERENT' ? (
                            <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                              <CheckCircle2 className="h-6 w-6" />
                            </div>
                          ) : res.status === 'VIOLATED' ? (
                            <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center text-destructive animate-pulse">
                              <AlertCircle className="h-6 w-6" />
                            </div>
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                              <Shield className="h-6 w-6" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-bold tracking-tight">{res.policy}</span>
                              <Badge
                                variant={res.status === 'ADHERENT' ? 'secondary' : 'destructive'}
                                className="text-[9px] uppercase font-bold tracking-widest px-2"
                              >
                                {res.status}
                              </Badge>
                            </div>
                            {res.status === 'VIOLATED' && (
                              <Button
                                size="sm"
                                className="h-8 bg-accent text-accent-foreground font-bold text-[10px] uppercase tracking-widest hover:bg-accent/90"
                                onClick={() => handleAutoFix(i, res.policy)}
                                disabled={fixingId === i}
                              >
                                {fixingId === i ? (
                                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                ) : (
                                  <Wrench className="mr-2 h-3 w-3" />
                                )}
                                <span>{fixingId === i ? '修復中...' : '一鍵修復 (FIX NOW)'}</span>
                              </Button>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed italic">
                            {res.details}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-accent flex items-center gap-2">
                  <Plus className="h-4 w-4" /> AI 建議之政策增強 (AI-Suggested Enhancements)
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {result.suggestedPolicies.map((sug, i) => (
                    <Card
                      key={i}
                      className="border-accent/20 bg-accent/5 hover:border-accent/40 transition-all group"
                    >
                      <CardContent className="p-5 space-y-4">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-sm font-bold text-accent group-hover:text-foreground transition-colors leading-tight">
                            {sug.policy}
                          </span>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8 shrink-0 border-accent/20 hover:bg-accent hover:text-accent-foreground"
                            onClick={() => handleAddToChecklist(sug.policy)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          {sug.reason}
                        </p>
                        <div className="pt-2">
                          <Button
                            variant="ghost"
                            className="w-full text-[9px] font-bold uppercase tracking-widest h-8 border border-accent/10 hover:bg-accent/10 group-hover:border-accent/30"
                            onClick={() => handleAddToChecklist(sug.policy)}
                          >
                            <span>新增到協議清單 (ADD TO PROTOCOL)</span>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
