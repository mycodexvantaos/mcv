'use client';

import { useEffect, useState, useMemo } from 'react';
import { Brain, Activity, Clock, Zap, AlertTriangle, ArrowUpRight, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Area,
  AreaChart,
  BarChart,
  Bar,
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ModelInstance, ModelProvider, ModelStatus } from '@/types/inference';

const mockModels: ModelInstance[] = [
  {
    id: 'm1',
    name: 'gemini-2.5-flash',
    provider: 'googleai',
    status: 'active',
    endpoint: 'generativelanguage.googleapis.com',
    apiKeyRef: '***',
    maxConcurrent: 100,
    currentLoad: 0.65,
  },
  {
    id: 'm2',
    name: 'gpt-4o',
    provider: 'openai',
    status: 'active',
    endpoint: 'api.openai.com',
    apiKeyRef: '***',
    maxConcurrent: 50,
    currentLoad: 0.42,
  },
  {
    id: 'm3',
    name: 'claude-sonnet-4',
    provider: 'anthropic',
    status: 'active',
    endpoint: 'api.anthropic.com',
    apiKeyRef: '***',
    maxConcurrent: 30,
    currentLoad: 0.28,
  },
  {
    id: 'm4',
    name: 'llama-3.1-70b',
    provider: 'local',
    status: 'idle',
    endpoint: 'edge-us-west:8080',
    apiKeyRef: '***',
    maxConcurrent: 20,
    currentLoad: 0.0,
  },
  {
    id: 'm5',
    name: 'gemini-2.5-pro',
    provider: 'googleai',
    status: 'draining',
    endpoint: 'generativelanguage.googleapis.com',
    apiKeyRef: '***',
    maxConcurrent: 50,
    currentLoad: 0.15,
  },
];

function generateMetricsData() {
  const data: {
    time: string;
    requests: number;
    latencyP50: number;
    latencyP99: number;
    errors: number;
    tokensIn: number;
    tokensOut: number;
  }[] = [];
  const now = Date.now();
  for (let i = 60; i >= 0; i--) {
    const t = new Date(now - i * 60000);
    data.push({
      time: `${t.getHours().toString().padStart(2, '0')}:${t.getMinutes().toString().padStart(2, '0')}`,
      requests: Math.round(400 + Math.random() * 300 + (i < 30 ? 200 : 0)),
      latencyP50: Math.round(50 + Math.random() * 30),
      latencyP99: Math.round(150 + Math.random() * 100),
      errors: Math.round(Math.random() * 5),
      tokensIn: Math.round(5000 + Math.random() * 3000),
      tokensOut: Math.round(2000 + Math.random() * 1500),
    });
  }
  return data;
}

const providerColors: Record<ModelProvider, string> = {
  googleai: 'hsl(var(--chart-1))',
  openai: 'hsl(var(--chart-2))',
  anthropic: 'hsl(var(--chart-3))',
  local: 'hsl(var(--chart-4))',
};

const statusColors: Record<ModelStatus, string> = {
  active: 'text-status-healthy',
  idle: 'text-status-idle',
  draining: 'text-status-warning',
  error: 'text-status-critical',
};

const statusBadge: Record<ModelStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  active: 'default',
  idle: 'secondary',
  draining: 'outline',
  error: 'destructive',
};

export default function InferencePage() {
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h'>('1h');
  const metricsData = useMemo(() => generateMetricsData(), [timeRange]);

  const totalRequests = metricsData.reduce((sum, d) => sum + d.requests, 0);
  const avgLatency = Math.round(
    metricsData.reduce((sum, d) => sum + d.latencyP50, 0) / metricsData.length
  );
  const totalErrors = metricsData.reduce((sum, d) => sum + d.errors, 0);
  const errorRate = ((totalErrors / totalRequests) * 100).toFixed(2);

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-headline">LM Inference Monitor</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time inference panorama across all deployed language models
          </p>
        </div>
        <div className="flex gap-2">
          {(['1h', '6h', '24h'] as const).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange(range)}
            >
              {range}
            </Button>
          ))}
        </div>
      </div>

      {/* Top KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-4 w-4 text-chart-1" />
              <p className="text-xs text-muted-foreground">Total Requests</p>
            </div>
            <p className="text-2xl font-bold font-headline">{totalRequests.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-chart-2" />
              <p className="text-xs text-muted-foreground">Avg Latency (P50)</p>
            </div>
            <p className="text-2xl font-bold font-headline">{avgLatency}ms</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-chart-3" />
              <p className="text-xs text-muted-foreground">Error Rate</p>
            </div>
            <p className="text-2xl font-bold font-headline">{errorRate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Brain className="h-4 w-4 text-chart-5" />
              <p className="text-xs text-muted-foreground">Active Models</p>
            </div>
            <p className="text-2xl font-bold font-headline">
              {mockModels.filter((m) => m.status === 'active').length}/{mockModels.length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Request Throughput</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metricsData}>
                  <defs>
                    <linearGradient id="throughputGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="time" tick={{ fontSize: 10 }} interval={9} />
                  <YAxis tick={{ fontSize: 10 }} width={40} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="requests"
                    stroke="hsl(var(--chart-1))"
                    fill="url(#throughputGrad)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Latency Distribution (P50 / P99)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metricsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="time" tick={{ fontSize: 10 }} interval={9} />
                  <YAxis tick={{ fontSize: 10 }} width={40} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      fontSize: '12px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="latencyP50"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2}
                    dot={false}
                    name="P50"
                  />
                  <Line
                    type="monotone"
                    dataKey="latencyP99"
                    stroke="hsl(var(--chart-3))"
                    strokeWidth={2}
                    dot={false}
                    name="P99"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Model Routing Table */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Model Routing Table</CardTitle>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Filter className="h-3.5 w-3.5" /> Filter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium">
                    Model
                  </th>
                  <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium">
                    Provider
                  </th>
                  <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium">
                    Status
                  </th>
                  <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium">
                    Load
                  </th>
                  <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium">
                    Endpoint
                  </th>
                </tr>
              </thead>
              <tbody>
                {mockModels.map((model) => (
                  <tr key={model.id} className="border-b border-border/50 hover:bg-secondary/30">
                    <td className="py-2.5 px-3 font-mono text-xs font-medium">{model.name}</td>
                    <td className="py-2.5 px-3">
                      <Badge
                        variant="outline"
                        className="text-[10px] h-5"
                        style={{
                          borderColor: providerColors[model.provider],
                          color: providerColors[model.provider],
                        }}
                      >
                        {model.provider}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge variant={statusBadge[model.status]} className="text-[10px] h-5">
                        <span
                          className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${model.status === 'active' ? 'bg-status-healthy' : model.status === 'idle' ? 'bg-status-idle' : model.status === 'draining' ? 'bg-status-warning' : 'bg-status-critical'}`}
                        />
                        {model.status}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 rounded-full bg-secondary overflow-hidden">
                          <div
                            className="h-full rounded-full bg-chart-1"
                            style={{ width: `${model.currentLoad * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground font-mono">
                          {(model.currentLoad * 100).toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-xs text-muted-foreground font-mono">
                      {model.endpoint}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
