"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, CheckCircle2, Users, ArrowUpRight, Scale, Gavel, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ConsensusPage() {
  const activeVotes = [
    {
      title: "Protocol Upgrade: Liquid V4.0",
      status: "VOTING",
      consensus: "94.2%",
      participants: 12042,
      timeLeft: "4h 22m",
    },
    {
      title: "Swarm Expansion: EU-West-4",
      status: "VALIDATED",
      consensus: "99.8%",
      participants: 8402,
      timeLeft: "Complete",
    },
    {
      title: "Risk Mitigation: Order_Service_02",
      status: "CRITICAL",
      consensus: "42.1%",
      participants: 320,
      timeLeft: "12m",
    },
  ];

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto scanline">
      <div className="flex flex-col space-y-2 border-b border-border/20 pb-8">
        <div className="flex items-center gap-2 text-primary">
          <Scale className="h-5 w-5" />
          <span className="text-[10px] font-bold uppercase tracking-[0.4em]">
            Sub-System: Global Consensus
          </span>
        </div>
        <h1 className="text-4xl font-bold font-headline tracking-tighter uppercase">
          全球共識層 (Global Consensus Layer)
        </h1>
        <p className="text-muted-foreground font-light max-w-2xl">
          基於 Liquid Protocol 的去中心化決策與價值對齊機制，確保蜂群行動符合核心倫理與安全規範。
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-border/40 bg-card/20">
            <CardHeader>
              <CardTitle className="text-xl font-headline uppercase tracking-wider">
                Active Consensus Proposals
              </CardTitle>
              <CardDescription>
                Human-AI collaborative voting on critical system updates.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeVotes.map((vote, i) => (
                <div
                  key={i}
                  className="p-6 rounded-xl border border-border/40 bg-background/30 flex items-center justify-between group hover:border-primary/40 transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h4 className="text-lg font-bold">{vote.title}</h4>
                      <Badge
                        variant={vote.status === "CRITICAL" ? "destructive" : "outline"}
                        className="text-[9px] font-mono border-primary/20 text-primary"
                      >
                        {vote.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" /> {vote.participants.toLocaleString()} Nodes
                      </span>
                      <span className="flex items-center gap-1">
                        <Lock className="h-3 w-3" /> Time Left: {vote.timeLeft}
                      </span>
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <div className="text-2xl font-mono font-bold text-primary">
                      {vote.consensus}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-[10px] uppercase font-bold tracking-widest h-8 px-6 hover:bg-primary hover:text-primary-foreground"
                    >
                      Cast Vote
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-card/20">
            <CardHeader>
              <CardTitle className="text-xl font-headline uppercase tracking-wider">
                Consensus History
              </CardTitle>
              <CardDescription>Audit trail of all validated global decisions.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/20">
                {[
                  {
                    date: "2024-05-20",
                    action: "Emergency Rollback: API Gateway",
                    weight: "0.98α",
                    result: "SUCCESS",
                  },
                  {
                    date: "2024-05-18",
                    action: "Resource Re-allocation: APAC Cluster",
                    weight: "0.92α",
                    result: "SUCCESS",
                  },
                  {
                    date: "2024-05-15",
                    action: "Policy Enforcement: mTLS v2",
                    weight: "1.00α",
                    result: "ENFORCED",
                  },
                ].map((log, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                  >
                    <span className="text-[10px] font-mono text-muted-foreground">{log.date}</span>
                    <span className="text-xs font-bold">{log.action}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-bold text-accent">{log.weight}</span>
                      <Badge className="bg-primary/20 text-primary border-none text-[8px]">
                        {log.result}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-primary">
                <Gavel className="h-4 w-4" /> Governance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { label: "Trust Index", value: "0.94α", color: "text-primary" },
                { label: "Decision Velocity", value: "240ms", color: "text-primary" },
                { label: "Conflict Rate", value: "0.02%", color: "text-accent" },
              ].map((metric) => (
                <div key={metric.label} className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {metric.label}
                  </p>
                  <div className={`text-3xl font-mono font-bold ${metric.color}`}>
                    {metric.value}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="p-8 rounded-3xl border border-border/40 bg-sidebar-background/50 space-y-4 text-center">
            <ShieldAlert className="h-10 w-10 text-accent mx-auto" />
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
              System Attestation
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              所有決策均已通過 <span className="text-foreground font-bold">SHA-512</span>{" "}
              數位簽章與全域節點共識驗證。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
