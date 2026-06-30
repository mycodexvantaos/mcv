"use client";

import { useState, useEffect } from "react";
import { senseGlobalPulse, type PulseSensingOutput } from "@/ai/client-stubs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  Globe,
  Loader2,
  AlertCircle,
  Zap,
  Waves,
  Target,
  ShieldCheck,
  Terminal,
  Users,
} from "lucide-react";

export default function PulseSensingPage() {
  const [loading, setLoading] = useState(false);
  const [pulse, setPulse] = useState<PulseSensingOutput | null>(null);
  const [streamData, setStreamData] = useState<string[]>([]);

  // Simulate real-time data stream ingestion
  useEffect(() => {
    const streams = [
      "INGEST: Twitter_API_V2 -> [Fever, Cough, Pandemic] frequency +340%",
      "INGEST: Bloomberg -> Semiconductor supply chain bottleneck detected",
      "INGEST: GitHub_Event_Stream -> Novel zero-day vulnerability proof-of-concept published",
      "INGEST: ArXiv_RSS -> Quantum Entanglement Phase Shift paper uploaded",
      "INGEST: WHO_Gateway -> Regional medical resource threshold exceeded",
    ];
    let i = 0;
    const interval = setInterval(() => {
      setStreamData((prev) => [streams[i % streams.length], ...prev].slice(0, 10));
      i++;
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const startSensing = async () => {
    setLoading(true);
    try {
      const output = await senseGlobalPulse({
        region: "Global Lattice",
        dataStreams: streamData,
      });
      setPulse(output);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto scanline">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border/20 pb-10">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Globe className="h-5 w-5 animate-spin-slow" />
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] font-mono">
              Month 3: Anomaly-Driven Orchestration
            </span>
          </div>
          <h1 className="text-5xl font-bold font-headline tracking-tighter uppercase leading-tight">
            Global <span className="text-primary italic">Pulse Sensing</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl font-light">
            Autonomous perception of world events. Detecting anomalies and self-generating goals via
            the organic matrix.
          </p>
        </div>
        <Button
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-12 h-14"
          onClick={startSensing}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Waves className="mr-2 h-4 w-4" />
          )}
          <span>
            <span className="uppercase tracking-widest text-[11px] font-bold">
              INVOKE GLOBAL PERCEPTION
            </span>
          </span>
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Real-time Streaming Panel */}
        <Card className="border-border/40 bg-card/30 flex flex-col h-full lg:col-span-1">
          <CardHeader className="bg-white/5 border-b border-border/10">
            <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-primary">
              <Terminal className="h-4 w-4" /> Data Stream Ingestion
            </CardTitle>
            <CardDescription className="text-[9px] uppercase tracking-tighter">
              Live feed from global lattice nodes.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <div className="p-4 font-mono text-[10px] leading-relaxed h-[500px] overflow-y-auto custom-scrollbar bg-black/40">
              {streamData.map((log, i) => (
                <div
                  key={i}
                  className="py-1 border-b border-white/5 animate-in fade-in slide-in-from-left-2 duration-300"
                >
                  <span className="text-primary/60">[{new Date().toLocaleTimeString()}]</span> {log}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-8">
          {!pulse ? (
            <div className="h-full min-h-[500px] flex flex-col items-center justify-center border-2 border-dashed border-primary/10 rounded-3xl space-y-6 bg-primary/5">
              <Activity className="h-16 w-16 text-primary/20 animate-pulse" />
              <p className="text-muted-foreground font-medium tracking-widest uppercase text-xs">
                Waiting for global matrix activation...
              </p>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <Card className="border-primary/20 bg-primary/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Globe className="h-32 w-32" />
                </div>
                <CardHeader>
                  <CardTitle className="text-2xl font-headline">Stability Assessment</CardTitle>
                  <CardDescription className="font-mono text-[10px] uppercase tracking-widest">
                    Global Sentiment Analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-xl font-light leading-relaxed text-foreground italic border-l-4 border-primary pl-6 py-2">
                    {pulse.globalSentiment}
                  </p>
                </CardContent>
              </Card>

              <div className="grid gap-6">
                <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-primary flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" /> Anomaly Detection Matrix
                </h3>
                {pulse.detectedAnomalies.map((anomaly, i) => (
                  <Card
                    key={i}
                    className="border-border/40 bg-card/30 hover:bg-card/50 transition-colors group"
                  >
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={anomaly.anomaly_score < 0.3 ? "destructive" : "secondary"}
                            className="text-[9px] uppercase font-bold px-3"
                          >
                            Score: {anomaly.anomaly_score.toFixed(2)}
                          </Badge>
                          <span className="text-xs font-mono text-muted-foreground">
                            {anomaly.source}
                          </span>
                        </div>
                        <CardTitle className="text-lg font-headline pt-1">
                          {anomaly.source} Shift
                        </CardTitle>
                      </div>
                      <div className="h-10 w-10 rounded-full border border-border/40 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-all">
                        <Activity className="h-5 w-5" />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-foreground/80 leading-relaxed font-light">
                        {anomaly.description}
                      </p>
                      <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                        <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1 flex items-center gap-2">
                          <Zap className="h-3 w-3" /> Organic Response Strategy
                        </h4>
                        <p className="text-xs text-muted-foreground italic leading-relaxed">
                          {anomaly.suggestedAction}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid gap-6">
                <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-accent flex items-center gap-2">
                  <Target className="h-4 w-4" /> Emergent System Goals
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {pulse.emergentGoals.map((goal, i) => (
                    <Card
                      key={i}
                      className="border-accent/20 bg-accent/5 hover:border-accent/40 transition-all"
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <Badge
                            variant="outline"
                            className="text-[8px] border-accent/30 text-accent font-mono"
                          >
                            TASK_{goal.task_id}
                          </Badge>
                          <Badge className="bg-accent/20 text-accent border-none text-[8px]">
                            {goal.priority}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm font-bold leading-tight">{goal.description}</p>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                          <Users className="h-3 w-3" /> Req: {goal.expertise_required}
                        </div>
                        <Button
                          variant="ghost"
                          className="w-full text-[9px] font-bold uppercase tracking-widest h-7 border border-accent/20 hover:bg-accent hover:text-accent-foreground"
                        >
                          DISPATCH TO SWARM
                        </Button>
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
