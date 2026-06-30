"use client";

import { useState } from "react";
import {
  Database,
  GitFork,
  HardDrive,
  Cloud,
  Plus,
  RefreshCw,
  Settings,
  Circle,
  Activity,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ConnectorType, ConnectorHealthStatus } from "@/types/connector";

interface ConnectorCardData {
  id: string;
  name: string;
  type: ConnectorType;
  status: ConnectorHealthStatus;
  latencyMs: number;
  connectionsActive: number;
  connectionsMax: number;
  queriesPerSecond: number;
  errorRate: number;
  lastHealthCheck: string;
}

const mockConnectors: ConnectorCardData[] = [
  {
    id: "c1",
    name: "Primary PostgreSQL",
    type: "postgresql",
    status: "connected",
    latencyMs: 3.2,
    connectionsActive: 42,
    connectionsMax: 100,
    queriesPerSecond: 1250,
    errorRate: 0.001,
    lastHealthCheck: "30s ago",
  },
  {
    id: "c2",
    name: "Redis Cache Cluster",
    type: "redis",
    status: "connected",
    latencyMs: 0.8,
    connectionsActive: 28,
    connectionsMax: 50,
    queriesPerSecond: 8500,
    errorRate: 0.0002,
    lastHealthCheck: "15s ago",
  },
  {
    id: "c3",
    name: "GitHub Integration",
    type: "github",
    status: "connected",
    latencyMs: 45,
    connectionsActive: 5,
    connectionsMax: 10,
    queriesPerSecond: 12,
    errorRate: 0.005,
    lastHealthCheck: "2m ago",
  },
  {
    id: "c4",
    name: "S3 Document Storage",
    type: "s3",
    status: "degraded",
    latencyMs: 120,
    connectionsActive: 15,
    connectionsMax: 20,
    queriesPerSecond: 45,
    errorRate: 0.02,
    lastHealthCheck: "1m ago",
  },
];

const connectorIcons: Record<ConnectorType, typeof Database> = {
  postgresql: Database,
  redis: HardDrive,
  github: GitFork,
  s3: Cloud,
  custom: Database,
};

const statusColors: Record<ConnectorHealthStatus, string> = {
  connected: "text-status-healthy",
  degraded: "text-status-warning",
  disconnected: "text-status-critical",
  configuring: "text-status-idle",
};

const statusDotColors: Record<ConnectorHealthStatus, string> = {
  connected: "bg-status-healthy",
  degraded: "bg-status-warning",
  disconnected: "bg-status-critical",
  configuring: "bg-status-idle",
};

export default function ConnectorsPage() {
  const [healthChecking, setHealthChecking] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const handleHealthCheck = (connectorId: string) => {
    setHealthChecking(connectorId);
    setTimeout(() => setHealthChecking(null), 2000);
  };

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-headline">Connector Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Provider-agnostic connector layer — PostgreSQL, Redis, GitHub, and more
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" /> Add Connector
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Connector</DialogTitle>
                <DialogDescription>
                  Configure a new connector instance. All settings are validated via Zod contracts
                  before saving.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="conn-name">Connector Name</Label>
                  <Input id="conn-name" placeholder="e.g., Production PostgreSQL" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="conn-type">Connector Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="postgresql">PostgreSQL</SelectItem>
                      <SelectItem value="redis">Redis</SelectItem>
                      <SelectItem value="github">GitHub</SelectItem>
                      <SelectItem value="s3">S3 Storage</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="conn-host">Host / Endpoint</Label>
                  <Input id="conn-host" placeholder="e.g., db.example.com:5432" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="conn-pool">Max Connections</Label>
                  <Input id="conn-pool" type="number" placeholder="100" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setAddDialogOpen(false)}>Create Connector</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Connectors</p>
            <p className="text-2xl font-bold font-headline">{mockConnectors.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Healthy</p>
            <p className="text-2xl font-bold font-headline text-status-healthy">
              {mockConnectors.filter((c) => c.status === "connected").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Degraded</p>
            <p className="text-2xl font-bold font-headline text-status-warning">
              {mockConnectors.filter((c) => c.status === "degraded").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Avg QPS</p>
            <p className="text-2xl font-bold font-headline">
              {Math.round(
                mockConnectors.reduce((s, c) => s + c.queriesPerSecond, 0) / mockConnectors.length
              ).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Connector Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mockConnectors.map((connector) => {
          const Icon = connectorIcons[connector.type];
          const poolPercent = (connector.connectionsActive / connector.connectionsMax) * 100;
          return (
            <Card key={connector.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-medium">{connector.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-[10px] h-4">
                          {connector.type}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <Circle
                            className={`h-2 w-2 fill-current ${statusDotColors[connector.status]}`}
                          />
                          <span className={`text-xs ${statusColors[connector.status]}`}>
                            {connector.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleHealthCheck(connector.id)}
                      disabled={healthChecking === connector.id}
                    >
                      {healthChecking === connector.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-lg font-bold font-headline">{connector.latencyMs}ms</p>
                    <p className="text-[10px] text-muted-foreground uppercase">Latency</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold font-headline">
                      {connector.queriesPerSecond.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase">QPS</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold font-headline">
                      {(connector.errorRate * 100).toFixed(2)}%
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase">Error Rate</p>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-muted-foreground">Connection Pool</p>
                    <p className="text-xs font-mono">
                      {connector.connectionsActive}/{connector.connectionsMax}
                    </p>
                  </div>
                  <Progress value={poolPercent} className="h-1.5" />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Last health check: {connector.lastHealthCheck}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
