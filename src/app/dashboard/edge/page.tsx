'use client';

import { useState } from 'react';
import {
  Globe,
  Cpu,
  HardDrive,
  Activity,
  RotateCcw,
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { EdgeNodeStatus } from '@/types/edge';

interface EdgeNodeData {
  id: string;
  name: string;
  region: string;
  status: EdgeNodeStatus;
  currentVersion: string;
  cpu: number;
  memory: number;
  gpu: number;
  models: string[];
  rps: number;
  latencyMs: number;
}

const mockNodes: EdgeNodeData[] = [
  {
    id: 'n1',
    name: 'us-west-2-primary',
    region: 'US West (Oregon)',
    status: 'online',
    currentVersion: 'v2.4.1',
    cpu: 0.45,
    memory: 0.62,
    gpu: 0.38,
    models: ['gemini-2.5-flash', 'llama-3.1-70b'],
    rps: 1250,
    latencyMs: 28,
  },
  {
    id: 'n2',
    name: 'us-east-1-primary',
    region: 'US East (Virginia)',
    status: 'online',
    currentVersion: 'v2.4.1',
    cpu: 0.32,
    memory: 0.48,
    gpu: 0.22,
    models: ['gpt-4o'],
    rps: 820,
    latencyMs: 35,
  },
  {
    id: 'n3',
    name: 'eu-central-1-primary',
    region: 'EU (Frankfurt)',
    status: 'online',
    currentVersion: 'v2.4.0',
    cpu: 0.58,
    memory: 0.71,
    gpu: 0.45,
    models: ['gemini-2.5-flash', 'claude-sonnet-4'],
    rps: 950,
    latencyMs: 42,
  },
  {
    id: 'n4',
    name: 'ap-southeast-1',
    region: 'Asia Pacific (Singapore)',
    status: 'deploying',
    currentVersion: 'v2.3.8',
    cpu: 0.0,
    memory: 0.0,
    gpu: 0.0,
    models: [],
    rps: 0,
    latencyMs: 0,
  },
  {
    id: 'n5',
    name: 'eu-west-2-secondary',
    region: 'EU (London)',
    status: 'online',
    currentVersion: 'v2.4.0',
    cpu: 0.28,
    memory: 0.35,
    gpu: 0.18,
    models: ['llama-3.1-70b'],
    rps: 340,
    latencyMs: 55,
  },
];

const statusIcons: Record<EdgeNodeStatus, typeof CheckCircle2> = {
  online: CheckCircle2,
  offline: XCircle,
  deploying: Loader2,
  draining: Clock,
  error: XCircle,
};

const statusColors: Record<EdgeNodeStatus, string> = {
  online: 'text-status-healthy',
  offline: 'text-status-critical',
  deploying: 'text-chart-1',
  draining: 'text-status-warning',
  error: 'text-status-critical',
};

const statusBadgeVariant: Record<
  EdgeNodeStatus,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  online: 'default',
  offline: 'destructive',
  deploying: 'secondary',
  draining: 'outline',
  error: 'destructive',
};

export default function EdgePage() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [rollingBack, setRollingBack] = useState<string | null>(null);

  const onlineNodes = mockNodes.filter((n) => n.status === 'online').length;
  const totalRps = mockNodes.reduce((s, n) => s + n.rps, 0);

  const handleRollback = (nodeId: string) => {
    setRollingBack(nodeId);
    setTimeout(() => setRollingBack(null), 3000);
  };

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-headline">Edge Deployment Console</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor and manage edge computing node deployments across regions
          </p>
        </div>
        <Button size="sm" className="gap-1.5">
          <ArrowUpRight className="h-4 w-4" /> Deploy New Version
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Nodes</p>
            <p className="text-2xl font-bold font-headline">{mockNodes.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Online</p>
            <p className="text-2xl font-bold font-headline text-status-healthy">{onlineNodes}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Deploying</p>
            <p className="text-2xl font-bold font-headline text-chart-1">
              {mockNodes.filter((n) => n.status === 'deploying').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total RPS</p>
            <p className="text-2xl font-bold font-headline">{totalRps.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Node Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {mockNodes.map((node) => {
          const StatusIcon = statusIcons[node.status];
          return (
            <Card
              key={node.id}
              className={`cursor-pointer transition-all ${selectedNode === node.id ? 'border-primary shadow-lg shadow-primary/10' : 'hover:border-primary/30'}`}
              onClick={() => setSelectedNode(selectedNode === node.id ? null : node.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                      <Globe className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-mono">{node.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">{node.region}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusBadgeVariant[node.status]} className="text-[10px] gap-1">
                      <StatusIcon
                        className={`h-3 w-3 ${node.status === 'deploying' ? 'animate-spin' : ''}`}
                      />
                      {node.status}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {node.currentVersion}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {node.status === 'online' && (
                  <>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <div className="flex items-center gap-1 mb-1">
                          <Cpu className="h-3 w-3 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground">CPU</span>
                        </div>
                        <Progress value={node.cpu * 100} className="h-1.5" />
                        <p className="text-xs font-mono mt-0.5">{(node.cpu * 100).toFixed(0)}%</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 mb-1">
                          <HardDrive className="h-3 w-3 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground">Memory</span>
                        </div>
                        <Progress value={node.memory * 100} className="h-1.5" />
                        <p className="text-xs font-mono mt-0.5">
                          {(node.memory * 100).toFixed(0)}%
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 mb-1">
                          <Activity className="h-3 w-3 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground">GPU</span>
                        </div>
                        <Progress value={node.gpu * 100} className="h-1.5" />
                        <p className="text-xs font-mono mt-0.5">{(node.gpu * 100).toFixed(0)}%</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground">Models:</p>
                        <div className="flex gap-1">
                          {node.models.map((m) => (
                            <Badge key={m} variant="secondary" className="text-[10px] h-5">
                              {m}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs font-mono">
                        <span>{node.rps} rps</span>
                        <span>{node.latencyMs}ms</span>
                      </div>
                    </div>
                  </>
                )}
                {node.status === 'deploying' && (
                  <div className="flex items-center gap-3 p-3 rounded-md bg-chart-1/10">
                    <Loader2 className="h-5 w-5 text-chart-1 animate-spin" />
                    <div>
                      <p className="text-sm font-medium">Deployment in progress...</p>
                      <p className="text-xs text-muted-foreground">
                        Building → Testing → Staging → Deploying → Verifying
                      </p>
                    </div>
                  </div>
                )}
                {selectedNode === node.id && node.status === 'online' && (
                  <div className="flex gap-2 pt-2 border-t border-border">
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <ChevronRight className="h-3.5 w-3.5" /> Details
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRollback(node.id);
                      }}
                      disabled={rollingBack === node.id}
                    >
                      {rollingBack === node.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <RotateCcw className="h-3.5 w-3.5" />
                      )}
                      {rollingBack === node.id ? 'Rolling back...' : 'Rollback'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
