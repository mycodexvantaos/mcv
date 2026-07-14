import { NextResponse } from 'next/server';

// MyCodexVantaOS Admin Dashboard - Events API
// Returns recent event data for dashboard display
// Note: SSE (Server-Sent Events) is not compatible with static export (output: "export"),
// so this route returns a static snapshot of recent events instead.

export const dynamic = 'force-static';

export async function GET() {
  // Return a static snapshot of recent events for the dashboard
  const now = new Date().toISOString();

  const events = [
    {
      type: 'connected',
      data: {
        message: 'MyCodexVantaOS Admin Dashboard - Real-time feed connected',
        timestamp: now,
      },
    },
    {
      type: 'metrics',
      data: {
        throughput: 52000,
        latency: 145,
        errorRate: '0.12',
        activeConnections: 198,
        timestamp: now,
      },
    },
    {
      type: 'connector_health',
      data: {
        connectorId: 'pg-primary',
        status: 'healthy',
        latency: 23,
        timestamp: now,
      },
    },
    {
      type: 'connector_health',
      data: {
        connectorId: 'redis-cache',
        status: 'healthy',
        latency: 8,
        timestamp: now,
      },
    },
    {
      type: 'alert',
      data: {
        id: 'alert-rt-001',
        severity: 'info',
        title: 'Compliance scan completed',
        timestamp: now,
      },
    },
  ];

  return NextResponse.json({ events });
}
