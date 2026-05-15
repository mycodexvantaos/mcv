import { NextResponse } from 'next/server';

// MyCodeXvantaOS Admin Dashboard - Events API (SSE)
// Server-Sent Events for real-time dashboard updates

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const sendEvent = (event: string, data: unknown) => {
        const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      // Send initial connection event
      sendEvent('connected', {
        message: 'MyCodeXvantaOS Admin Dashboard - Real-time feed connected',
        timestamp: new Date().toISOString(),
      });

      // Simulate periodic metrics updates
      const metricsInterval = setInterval(() => {
        sendEvent('metrics', {
          throughput: Math.floor(40000 + Math.random() * 20000),
          latency: Math.floor(120 + Math.random() * 60),
          errorRate: (Math.random() * 0.5).toFixed(2),
          activeConnections: Math.floor(180 + Math.random() * 40),
          timestamp: new Date().toISOString(),
        });
      }, 5000);

      // Simulate periodic connector health updates
      const healthInterval = setInterval(() => {
        const connectors = [
          'pg-primary',
          'pg-replica',
          'redis-cache',
          'github-scm',
          's3-storage',
          'custom-webhook',
        ];
        const connectorId = connectors[Math.floor(Math.random() * connectors.length)];
        const isHealthy = Math.random() > 0.15;

        sendEvent('connector_health', {
          connectorId,
          status: isHealthy ? 'healthy' : 'degraded',
          latency: isHealthy
            ? Math.floor(5 + Math.random() * 80)
            : Math.floor(150 + Math.random() * 200),
          timestamp: new Date().toISOString(),
        });
      }, 8000);

      // Simulate occasional alerts
      const alertInterval = setInterval(() => {
        const severities = ['info', 'warning', 'critical'];
        const messages = [
          'Model inference latency spike detected',
          'Connector health check passed',
          'Edge node deployment completed',
          'Secret rotation reminder',
          'Compliance scan completed',
          'Memory usage approaching threshold',
        ];

        sendEvent('alert', {
          id: `alert-rt-${Date.now()}`,
          severity: severities[Math.floor(Math.random() * severities.length)],
          title: messages[Math.floor(Math.random() * messages.length)],
          timestamp: new Date().toISOString(),
        });
      }, 15000);

      // Clean up on abort
      request.signal.addEventListener('abort', () => {
        clearInterval(metricsInterval);
        clearInterval(healthInterval);
        clearInterval(alertInterval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
