import { NextRequest } from 'next/server';

/**
 * GET /api/events
 * Server-Sent Events (SSE) endpoint for real-time platform updates.
 * Streams: deployment status, alert changes, connector health, inference metrics.
 */
export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, data: unknown) => {
        const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(payload));
      };

      // Initial connection event
      send('connected', {
        message: 'MyCodeXvantaOS SSE stream connected',
        ts: new Date().toISOString(),
      });

      // Simulate periodic events
      let tick = 0;
      const interval = setInterval(() => {
        tick++;

        if (tick % 3 === 0) {
          send('inference-metrics', {
            requestsPerMin: Math.floor(60 + Math.random() * 80),
            latencyP95Ms: Math.floor(150 + Math.random() * 100),
            errorRate: parseFloat((Math.random() * 0.05).toFixed(4)),
            ts: new Date().toISOString(),
          });
        }

        if (tick % 5 === 0) {
          send('connector-health', {
            id: 'connector-mongodb',
            status: Math.random() > 0.3 ? 'healthy' : 'degraded',
            latencyMs: Math.floor(10 + Math.random() * 400),
            ts: new Date().toISOString(),
          });
        }

        if (tick % 10 === 0) {
          send('alert', {
            id: `alert-${Date.now()}`,
            severity: Math.random() > 0.8 ? 'warning' : 'info',
            message: 'System event detected',
            ts: new Date().toISOString(),
          });
        }

        // Close after 30 ticks (~30s) to avoid hanging connections
        if (tick >= 30) {
          clearInterval(interval);
          controller.close();
        }
      }, 1_000);

      // Handle client disconnect
      req.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
