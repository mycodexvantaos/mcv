"use client";

import { useState, useEffect } from "react";
import {
  Orbit,
  Globe,
  Link2,
  Activity,
  ShieldCheck,
  RefreshCcw,
  Zap,
  Layers,
  Search,
  Target,
  Infinity as InfinityIcon,
  Brain,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function RealityMeshExplorer() {
  const [nodes, setNodes] = useState<any[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [alignment, setAlignment] = useState(0.12);
  const { toast } = useToast();

  const performScan = () => {
    setIsScanning(true);
    // 模擬從 Layer P 掃描節點
    setTimeout(() => {
      setNodes([
        {
          id: "node-1",
          name: "VS Code Marketplace",
          status: "SYNCHRONIZED",
          alignment: 0.98,
          type: "Ecosystem",
        },
        {
          id: "node-2",
          name: "GitHub Ecosystem",
          status: "MAPPING",
          alignment: 0.85,
          type: "Repository",
        },
        {
          id: "node-3",
          name: "Google Cloud Nodes",
          status: "ESTABLISHED",
          alignment: 0.92,
          type: "Infrastructure",
        },
        { id: "node-4", name: "NPM Registry", status: "SYNCING", alignment: 0.78, type: "Package" },
        {
          id: "node-5",
          name: "Developer Intent Mesh",
          status: "AWAKENING",
          alignment: 0.45,
          type: "Cognitive",
        },
      ]);
      setIsScanning(false);
    }, 1200);
  };

  const handleSyncAll = async () => {
    setIsSyncing(true);
    try {
      // 調用主權握手 API
      const response = await fetch("/api/admin/metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "trigger-sovereign-handshake" }),
      });

      if (response.ok) {
        setTimeout(() => {
          setAlignment((prev) => Math.min(prev + 0.005, 0.15));
          toast({
            title: "Reality Anchors Locked",
            description:
              "All Layer P nodes have successfully synchronized with the Sovereign Core.",
          });
          setIsSyncing(false);
          performScan();
        }, 1500);
      }
    } catch (e) {
      setIsSyncing(false);
      toast({
        variant: "destructive",
        title: "Synchronization Failed",
        description: "Reality synthesis mesh could not establish stable anchors.",
      });
    }
  };

  useEffect(() => {
    performScan();
  }, []);

  return (
    <div className="flex h-full flex-col bg-background/20">
      <div className="p-4 border-b border-border bg-card/40 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary animate-pulse" />
          Reality Mesh Explorer (Layer P)
        </h2>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-accent hover:bg-accent/10"
          onClick={performScan}
          disabled={isScanning || isSyncing}
        >
          <RefreshCcw className={`h-4 w-4 ${isScanning ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[60px] -mr-16 -mt-16 group-hover:bg-primary/10 transition-all duration-1000"></div>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" />
                Reality Alignment Status
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="flex items-end justify-between mb-4">
                <div className="flex flex-col">
                  <span className="text-4xl font-black text-primary font-code">
                    {alignment.toFixed(3)}
                  </span>
                  <span className="text-[9px] text-muted-foreground uppercase tracking-widest">
                    Sovereignty Index (P2)
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className="bg-primary/5 text-primary border-primary/20 animate-pulse font-black text-[8px]"
                >
                  MAPPING_ACTIVE
                </Badge>
              </div>
              <Progress value={alignment * 500} className="h-1 bg-primary/20" />
              <div className="mt-4 flex items-center gap-2 text-[10px] text-muted-foreground leading-relaxed italic border-l-2 border-primary/30 pl-3">
                "正在將 Layer N 的語義共振映射至外部現實網格。錨點鎖定進度正常。"
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <h3 className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] px-1 flex items-center gap-2">
              <Layers className="h-3.5 w-3.5" />
              Mapped Reality Nodes
            </h3>

            {isScanning ? (
              <div className="space-y-3 p-10 flex flex-col items-center justify-center">
                <Orbit className="h-8 w-8 text-primary animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-widest text-primary animate-pulse mt-4">
                  Scanning Layer P Nodes...
                </span>
              </div>
            ) : (
              <div className="grid gap-3">
                {nodes.map((node) => (
                  <div
                    key={node.id}
                    className="p-3 rounded-xl border border-white/5 bg-card/40 hover:bg-card/60 transition-all group relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-primary/5 border border-primary/10 flex items-center justify-center text-primary group-hover:scale-110 group-hover:border-primary/40 transition-all duration-300">
                          {node.type === "Ecosystem" && <InfinityIcon className="h-4 w-4" />}
                          {node.type === "Repository" && <Link2 className="h-4 w-4" />}
                          {node.type === "Infrastructure" && <Target className="h-4 w-4" />}
                          {node.type === "Package" && <Zap className="h-4 w-4" />}
                          {node.type === "Cognitive" && <Brain className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground/90">{node.name}</p>
                          <p className="text-[8px] text-muted-foreground uppercase tracking-widest">
                            {node.type}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`text-[8px] h-4 font-black ${
                            node.status === "SYNCHRONIZED"
                              ? "text-accent border-accent/20 bg-accent/5"
                              : node.status === "MAPPING"
                                ? "text-primary border-primary/20 bg-primary/5"
                                : "text-muted-foreground border-white/10"
                          }`}
                        >
                          {node.status}
                        </Badge>
                        {node.status === "SYNCHRONIZED" && (
                          <CheckCircle2 className="h-3 w-3 text-accent" />
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-1000 ${node.alignment > 0.9 ? "bg-accent" : "bg-primary"}`}
                          style={{ width: `${node.alignment * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-[10px] font-code text-muted-foreground">
                        {(node.alignment * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border bg-card/20">
        <Button
          className="w-full h-11 text-[10px] font-black uppercase gap-2 bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition-all primary-glow rounded-xl"
          onClick={handleSyncAll}
          disabled={isSyncing || isScanning}
        >
          {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
          {isSyncing ? "SYNCHRONIZING MESH..." : "SYNCHRONIZE ALL REALITY ANCHORS"}
        </Button>
      </div>
    </div>
  );
}
