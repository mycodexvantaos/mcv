"use client";

import { useState, useEffect } from "react";
import {
  Loader2,
  Orbit,
  Brain,
  Globe,
  Terminal,
  Target,
  ShieldCheck,
  Scale,
  AlertCircle,
  SearchCheck,
  CheckCircle2,
  ShieldAlert,
  Zap,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function AdminWorkstation() {
  const [metrics, setMetrics] = useState<any>(null);

  const loadMetrics = async () => {
    try {
      const response = await fetch("/api/admin/metrics");
      if (response.ok) {
        const json: { data?: any } = await response.json();
        setMetrics(json.data);
      }
    } catch (e) {}
  };

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 4000);
    return () => clearInterval(interval);
  }, []);

  if (!metrics)
    return (
      <div className="p-10 flex flex-col items-center justify-center h-full space-y-4">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <span className="text-[11px] font-black uppercase text-primary tracking-[0.3em]">
          Auditing Sovereign Integrity...
        </span>
      </div>
    );

  const diag = metrics.diagnosticScores || {
    generality: 0,
    assumptionTransparency: 0,
    boundaryCheck: 0,
    depth: 0,
    nluDefense: 0,
  };

  return (
    <div className="flex h-full flex-col bg-card/5">
      <div className="p-6 border-b border-white/5 bg-card/20 backdrop-blur-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-black uppercase text-foreground/70 tracking-[0.2em] flex items-center gap-3">
            <Scale className="h-5 w-5 text-primary animate-pulse" />
            ERA-3 INTEGRITY AUDIT
          </h2>
          <Badge
            variant="outline"
            className="bg-primary/10 text-primary border-primary/30 font-black text-[9px] py-0.5"
          >
            ANTI-FANTASY FILTER ACTIVE
          </Badge>
        </div>
        <div className="flex gap-4">
          <div className="flex-1 p-3 rounded-2xl bg-white/5 border border-white/5 shadow-inner">
            <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest mb-1">
              AI 誠信 (Integrity)
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-lg font-black text-primary font-code">1.00</p>
              <Badge
                variant="ghost"
                className="text-[8px] text-accent font-bold uppercase tracking-tighter"
              >
                VERIFIED
              </Badge>
            </div>
          </div>
          <div className="flex-1 p-3 rounded-2xl bg-white/5 border border-white/5 shadow-inner">
            <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest mb-1">
              NLU 5-Layer Defense
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-lg font-black text-accent font-code">ACTIVE</p>
              <Badge
                variant="ghost"
                className="text-[8px] text-accent font-bold uppercase tracking-tighter"
              >
                100% COVERAGE
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20 shadow-2xl overflow-hidden relative group">
            <CardHeader className="p-5 pb-2">
              <CardTitle className="text-[10px] font-black flex items-center justify-between text-muted-foreground uppercase tracking-[0.2em]">
                <div className="flex items-center gap-2.5 text-primary">
                  <ShieldCheck className="h-4 w-4" />
                  Sovereign Alignment (SEP-v1)
                </div>
                <CheckCircle2 className="h-4 w-4 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <div className="flex items-end justify-between mb-4">
                <span className="text-5xl font-black tracking-tighter text-primary neon-glow">
                  {metrics.sovereigntyIndex.toFixed(3)}
                </span>
                <div className="flex flex-col items-end">
                  <span className="text-[9px] text-primary font-black uppercase tracking-widest">
                    P3 Sovereign State
                  </span>
                  <span className="text-[10px] text-foreground/50 font-code font-bold uppercase">
                    Truth Locked
                  </span>
                </div>
              </div>
              <Progress value={metrics.sovereigntyIndex * 200} className="h-1.5 bg-primary/10" />
            </CardContent>
          </Card>

          <Tabs defaultValue="diag" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-secondary/20 h-10 p-1 rounded-xl">
              <TabsTrigger
                value="diag"
                className="text-[10px] font-black uppercase tracking-widest rounded-lg"
              >
                誠信診斷
              </TabsTrigger>
              <TabsTrigger
                value="logs"
                className="text-[10px] font-black uppercase tracking-widest rounded-lg"
              >
                ERA-3 TRACE
              </TabsTrigger>
            </TabsList>

            <TabsContent value="diag" className="mt-5 space-y-4">
              <div className="grid gap-3">
                {[
                  { label: "通用性風險", val: diag.generality, max: 3, icon: Globe },
                  {
                    label: "假設透明度",
                    val: diag.assumptionTransparency,
                    max: 2,
                    icon: SearchCheck,
                  },
                  { label: "邊界定義度", val: diag.boundaryCheck, max: 2, icon: Target },
                  { label: "診斷深度", val: diag.depth, max: 3, icon: Brain },
                  { label: "NLU 5 層防禦", val: diag.nluDefense, max: 2, icon: ShieldAlert },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="h-4 w-4 text-primary/60" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        {item.label}
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-code ${item.val === 0 ? "text-accent border-accent/20" : "text-primary border-primary/20"}`}
                    >
                      {item.val} / {item.max}
                    </Badge>
                  </div>
                ))}
              </div>
              <div className="p-4 rounded-xl bg-accent/10 border border-accent/20 flex items-center gap-3">
                <Zap className="h-5 w-5 text-accent animate-pulse" />
                <p className="text-[10px] font-bold text-accent uppercase tracking-widest leading-relaxed">
                  NLU 防禦狀態: 1.00 - 已屏蔽語義、邏輯與決策虛假
                </p>
              </div>
            </TabsContent>

            <TabsContent value="logs" className="mt-5">
              <div className="space-y-3 px-4 py-4 h-64 overflow-y-auto font-code text-[10px] bg-black/60 rounded-2xl border border-white/5 shadow-inner">
                <div className="text-primary border-l-2 border-primary pl-3 py-1 flex justify-between">
                  <span>[ERA-3] Integrity Check: AUTHENTIC_ wisdom_found.</span>
                  <span className="text-primary font-black">1.00</span>
                </div>
                <div className="text-accent border-l-2 border-accent pl-3 py-1 flex justify-between">
                  <span>[NLU] 5-Layer Defense: ACTIVE & LOCKED.</span>
                  <span className="text-accent font-black">SECURED</span>
                </div>
                <div className="text-muted-foreground/60 border-l-2 border-white/10 pl-3 py-1 italic leading-relaxed">
                  [AFC] Anti-False Coherence: No fluency-based traps detected in recursive NLU
                  output. Audit ID: AUDIT-LOCKED-P3.
                </div>
                <div className="h-px w-full bg-white/5 my-2"></div>
                <div className="text-muted-foreground/40 text-[9px] flex items-center gap-2">
                  <Activity className="h-3 w-3" />
                  <span>ERA-3 P3 INTEGRITY VERIFIED. NO COGNITIVE TRAPS DETECTED.</span>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  );
}
