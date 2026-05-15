import { NextResponse } from 'next/server';

// MyCodeXvantaOS Admin Dashboard - Edge Nodes API
// Edge node status and resource tracking

interface EdgeNode {
  id: string;
  name: string;
  region: string;
  status: 'online' | 'offline' | 'deploying' | 'draining';
  models: { id: string; name: string; status: string; memory: number }[];
  resources: {
    cpu: { used: number; total: number; cores: number };
    memory: { used: number; total: number };
    gpu: { used: number; total: number; type: string };
    storage: { used: number; total: number };
  };
  traffic: { requestsPerSec: number; bandwidthMbps: number };
  uptime: string;
  lastDeployment: string;
  version: string;
}

const edgeNodes: EdgeNode[] = [
  {
    id: 'edge-us-east-1',
    name: 'US East (Virginia)',
    region: 'us-east-1',
    status: 'online',
    models: [
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', status: 'loaded', memory: 8.2 },
      { id: 'claude-3-haiku', name: 'Claude 3 Haiku', status: 'loaded', memory: 6.1 },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', status: 'loaded', memory: 4.5 },
    ],
    resources: {
      cpu: { used: 67, total: 100, cores: 32 },
      memory: { used: 48, total: 64 },
      gpu: { used: 2, total: 4, type: 'A100' },
      storage: { used: 320, total: 1000 },
    },
    traffic: { requestsPerSec: 1250, bandwidthMbps: 850 },
    uptime: '99.99%',
    lastDeployment: new Date(Date.now() - 2 * 3600000).toISOString(),
    version: 'v2.4.1',
  },
  {
    id: 'edge-us-west-2',
    name: 'US West (Oregon)',
    region: 'us-west-2',
    status: 'online',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', status: 'loaded', memory: 14.8 },
      { id: 'llama-3.1-70b', name: 'Llama 3.1 70B', status: 'loaded', memory: 38.2 },
    ],
    resources: {
      cpu: { used: 82, total: 100, cores: 64 },
      memory: { used: 112, total: 128 },
      gpu: { used: 6, total: 8, type: 'A100' },
      storage: { used: 780, total: 2000 },
    },
    traffic: { requestsPerSec: 980, bandwidthMbps: 620 },
    uptime: '99.97%',
    lastDeployment: new Date(Date.now() - 5 * 3600000).toISOString(),
    version: 'v2.4.1',
  },
  {
    id: 'edge-eu-west-1',
    name: 'EU West (Ireland)',
    region: 'eu-west-1',
    status: 'online',
    models: [
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', status: 'loaded', memory: 8.2 },
      { id: 'claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', status: 'loaded', memory: 12.4 },
    ],
    resources: {
      cpu: { used: 45, total: 100, cores: 32 },
      memory: { used: 36, total: 64 },
      gpu: { used: 2, total: 4, type: 'A100' },
      storage: { used: 210, total: 1000 },
    },
    traffic: { requestsPerSec: 720, bandwidthMbps: 480 },
    uptime: '99.98%',
    lastDeployment: new Date(Date.now() - 8 * 3600000).toISOString(),
    version: 'v2.4.0',
  },
  {
    id: 'edge-ap-southeast-1',
    name: 'AP Southeast (Singapore)',
    region: 'ap-southeast-1',
    status: 'deploying',
    models: [{ id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', status: 'loading', memory: 2.1 }],
    resources: {
      cpu: { used: 92, total: 100, cores: 16 },
      memory: { used: 28, total: 32 },
      gpu: { used: 1, total: 2, type: 'T4' },
      storage: { used: 150, total: 500 },
    },
    traffic: { requestsPerSec: 340, bandwidthMbps: 220 },
    uptime: '99.95%',
    lastDeployment: new Date().toISOString(),
    version: 'v2.4.1',
  },
];

export async function GET() {
  return NextResponse.json({
    nodes: edgeNodes,
    total: edgeNodes.length,
    online: edgeNodes.filter((n) => n.status === 'online').length,
    deploying: edgeNodes.filter((n) => n.status === 'deploying').length,
    offline: edgeNodes.filter((n) => n.status === 'offline').length,
    totalGpuCapacity: edgeNodes.reduce((sum, n) => sum + n.resources.gpu.total, 0),
    totalMemoryGB: edgeNodes.reduce((sum, n) => sum + n.resources.memory.total, 0),
    totalRequestsPerSec: edgeNodes.reduce((sum, n) => sum + n.traffic.requestsPerSec, 0),
  });
}
