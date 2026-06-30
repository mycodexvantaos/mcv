"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Users,
  Network,
  Activity,
  Globe,
  Layers,
  Database,
  Search,
  Plus,
  Terminal,
  ShieldCheck,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

export default function SwarmPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [nodes, setNodes] = useState([
    {
      id: "node_alpha_01",
      name: "AlphaFold_Reasoning",
      type: "Scientific",
      rating: 4.8,
      latency: "4ms",
      load: 42,
      status: "SYNCED",
    },
    {
      id: "node_gamma_04",
      name: "Zero_Shot_Code_Forge",
      type: "DevOps",
      rating: 4.9,
      latency: "12ms",
      load: 88,
      status: "FORGING",
    },
    {
      id: "node_delta_09",
      name: "Pulse_Sensor_Matrix",
      type: "Perception",
      rating: 4.7,
      latency: "2ms",
      load: 15,
      status: "STREAMING",
    },
    {
      id: "node_omega_12",
      name: "Consensus_Validator",
      type: "Governance",
      rating: 5.0,
      latency: "24ms",
      load: 64,
      status: "VALIDATING",
    },
  ]);

  // Simulate real-time node activity
  useEffect(() => {
    const interval = setInterval(() => {
      setNodes((prev) =>
        prev.map((node) => ({
          ...node,
          load: Math.min(100, Math.max(0, node.load + Math.floor(Math.random() * 6) - 3)),
          latency: `${Math.max(1, parseInt(node.latency) + Math.floor(Math.random() * 4) - 2)}ms`,
        }))
      );
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleRegister = () => {
    toast({
      title: "Capability Protocol: Initiated",
      description: "Generating node identity key and registering metadata...",
    });
  };

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto scanline">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border/20 pb-10">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Network className="h-5 w-5" />
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] font-mono">
              Month 1: Capability Discovery Protocol
            </span>
          </div>
          <h1 className="text-5xl font-bold font-headline tracking-tighter uppercase leading-tight">
            Swarm <span className="text-primary italic">Node Registry</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl font-light">
            Dynamic discovery and orchestrating of global expert nodes via vectorized metadata
            matching.
          </p>
        </div>
        <Button
          onClick={handleRegister}
          className="bg-primary text-primary-foreground font-bold uppercase tracking-widest text-[11px] h-12 px-8"
        >
          <Plus className="mr-2 h-4 w-4" /> <span>Register New Node</span>
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-border/40 bg-card/20">
            <CardHeader className="flex flex-row items-center justify-between bg-white/5 border-b border-border/10">
              <div className="space-y-1">
                <CardTitle className="text-xl font-headline uppercase tracking-wider">
                  Active Swarm Clusters
                </CardTitle>
                <CardDescription>
                  Verified nodes currently participating in the Liquid Intelligence Network.
                </CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by capability..."
                  className="pl-10 bg-background/50 border-border/40 h-9 text-xs"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/20">
                {nodes
                  .filter((n) => n.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((node) => (
                    <div
                      key={node.id}
                      className="flex items-center justify-between p-6 hover:bg-white/5 transition-colors group"
                    >
                      <div className="flex items-center gap-5">
                        <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                          <Layers className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <h4 className="text-base font-bold font-mono tracking-tight">
                              {node.name}
                            </h4>
                            <Badge
                              variant="outline"
                              className="text-[8px] font-mono border-primary/30 text-primary"
                            >
                              {node.id}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            <span>{node.type} Module</span>
                            <span className="flex items-center gap-1 text-accent">
                              <Database className="h-3 w-3" /> <span>Rating: {node.rating}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-8 text-right">
                        <div className="space-y-1 w-24">
                          <p className="text-[9px] text-muted-foreground uppercase font-bold text-center">
                            Load Profile
                          </p>
                          <Progress
                            value={node.load}
                            className="h-1 bg-white/5"
                            indicatorClassName="bg-primary"
                          />
                        </div>
                        <div className="space-y-0.5 min-w-[60px]">
                          <p className="text-[9px] text-muted-foreground uppercase font-bold">
                            Latency
                          </p>
                          <p className="text-sm font-mono text-primary">{node.latency}</p>
                        </div>
                        <Badge className="bg-primary/20 text-primary border-none text-[8px] tracking-widest px-3">
                          {node.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-card/20">
            <CardHeader>
              <CardTitle className="text-xl font-headline uppercase tracking-wider">
                Discovery Logs
              </CardTitle>
              <CardDescription>
                Recent Capability Discovery Protocol (CDP) requests.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-4 bg-black/40 font-mono text-[11px] leading-relaxed border-t border-border/20">
                <div className="flex gap-4 text-primary/60 border-b border-border/10 pb-2 mb-2">
                  <span className="w-20">TIMESTAMP</span>
                  <span className="w-32">PROTOCOL</span>
                  <span>EVENT_LOG</span>
                </div>
                {[
                  {
                    time: new Date().toLocaleTimeString(),
                    protocol: "CDP_REQ_001",
                    log: "Matching capability 'molecular_prediction' -> Found 2 candidates",
                  },
                  {
                    time: new Date().toLocaleTimeString(),
                    protocol: "CDP_SYNC",
                    log: "Node 'node_gamma_04' heartbeat verified via SHA-512",
                  },
                  {
                    time: new Date().toLocaleTimeString(),
                    protocol: "CDP_REG",
                    log: "New human expert node 'human_node_99' registered",
                  },
                ].map((l, i) => (
                  <div key={i} className="flex gap-4 py-1 hover:bg-white/5 transition-colors">
                    <span className="w-20 text-muted-foreground">{l.time}</span>
                    <span className="w-32 text-primary">{l.protocol}</span>
                    <span className="text-foreground">{l.log}</span>
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
                <Terminal className="h-4 w-4" /> Network Topology
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center p-10">
              <div className="relative w-full aspect-square border-2 border-dashed border-primary/20 rounded-full flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,255,0.1),transparent)]" />
                <Globe className="h-32 w-32 text-primary opacity-20 animate-spin-slow" />
                <div className="absolute top-1/4 left-1/4 h-2 w-2 bg-primary rounded-full animate-pulse shadow-[0_0_15px_hsl(var(--primary))]" />
                <div className="absolute bottom-1/3 right-1/4 h-2 w-2 bg-accent rounded-full animate-pulse shadow-[0_0_15px_hsl(var(--accent))]" />
                <div className="absolute top-1/2 right-1/2 h-2 w-2 bg-primary rounded-full animate-pulse" />
                <div className="absolute top-1/3 right-10 h-1.5 w-1.5 bg-primary/40 rounded-full" />
                <p className="absolute bottom-12 text-[9px] font-bold uppercase tracking-[0.3em] text-muted-foreground animate-flicker">
                  Mapping Global Intel...
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2 pt-0">
              <div className="w-full flex justify-between text-[10px] font-bold uppercase tracking-widest">
                <span className="text-muted-foreground">Active Nodes</span>
                <span className="text-primary">104,203</span>
              </div>
              <div className="w-full flex justify-between text-[10px] font-bold uppercase tracking-widest">
                <span className="text-muted-foreground">Network Synchrony</span>
                <span className="text-primary">99.98%</span>
              </div>
            </CardFooter>
          </Card>

          <div className="p-8 rounded-3xl border border-border/40 bg-sidebar-background/50 space-y-4 text-center">
            <ShieldCheck className="h-10 w-10 text-primary mx-auto" />
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
              Node Integrity
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              All registered nodes have passed{" "}
              <span className="text-foreground font-bold">Proof-of-Intelligence</span> validation
              and are bound by the Liquid Consensus protocol.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
