import { NextResponse } from 'next/server';

/**
 * GET /api/edge/nodes
 * Returns the list of edge deployment nodes and their current status.
 */
export async function GET() {
  const nodes = [
    {
      id: 'edge-node-tw-01',
      region: 'ap-east-1',
      location: 'Taiwan',
      status: 'running',
      cpuPercent: 42,
      memPercent: 58,
      services: 5,
      lastSync: new Date().toISOString(),
      k8sVersion: '1.29.3',
      platform: 'mycodexvantaos-prod',
    },
    {
      id: 'edge-node-us-01',
      region: 'us-west-2',
      location: 'Oregon',
      status: 'running',
      cpuPercent: 31,
      memPercent: 44,
      services: 4,
      lastSync: new Date().toISOString(),
      k8sVersion: '1.29.3',
      platform: 'mycodexvantaos-prod',
    },
    {
      id: 'edge-node-eu-01',
      region: 'eu-central-1',
      location: 'Frankfurt',
      status: 'running',
      cpuPercent: 55,
      memPercent: 67,
      services: 6,
      lastSync: new Date().toISOString(),
      k8sVersion: '1.29.2',
      platform: 'mycodexvantaos-prod',
    },
    {
      id: 'edge-node-sg-01',
      region: 'ap-southeast-1',
      location: 'Singapore',
      status: 'degraded',
      cpuPercent: 88,
      memPercent: 91,
      services: 3,
      lastSync: new Date(Date.now() - 300_000).toISOString(),
      k8sVersion: '1.28.8',
      platform: 'mycodexvantaos-staging',
    },
    {
      id: 'edge-node-dev-01',
      region: 'local',
      location: 'Dev Sandbox',
      status: 'running',
      cpuPercent: 12,
      memPercent: 28,
      services: 2,
      lastSync: new Date().toISOString(),
      k8sVersion: '1.29.3',
      platform: 'mycodexvantaos-dev',
    },
  ];

  const summary = {
    total: nodes.length,
    running: nodes.filter((n) => n.status === 'running').length,
    degraded: nodes.filter((n) => n.status === 'degraded').length,
    offline: nodes.filter((n) => n.status === 'offline').length,
  };

  return NextResponse.json({ success: true, data: { nodes, summary } });
}
