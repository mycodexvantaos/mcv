import { NextResponse } from 'next/server';

// MyCodeXvantaOS Admin Dashboard - Inference Metrics API
// Time-series metrics for LM inference monitoring

function generateMetricPoints(
  hours: number,
  baseValue: number,
  variance: number,
  trend: number = 0
) {
  const points: { timestamp: string; value: number }[] = [];
  const now = new Date();
  for (let i = hours * 12; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 5 * 60000); // 5-min intervals
    const noise = (Math.random() - 0.5) * variance;
    const trendOffset = (hours * 12 - i) * trend;
    const hourOfDay = timestamp.getHours();
    const dayPattern = Math.sin(((hourOfDay - 6) * Math.PI) / 12) * variance * 0.3;
    points.push({
      timestamp: timestamp.toISOString(),
      value: Math.max(0, baseValue + noise + dayPattern + trendOffset),
    });
  }
  return points;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const range = searchParams.get('range') || '24h';

  const hours = range === '1h' ? 1 : range === '6h' ? 6 : 24;

  const metrics = {
    throughput: generateMetricPoints(hours, 52000, 8000, 0.5),
    latency: generateMetricPoints(hours, 142, 30, -0.1),
    errorRate: generateMetricPoints(hours, 0.23, 0.1, 0),
    tokenUsage: {
      input: generateMetricPoints(hours, 2500000, 500000, 1000),
      output: generateMetricPoints(hours, 800000, 200000, 500),
    },
    modelDistribution: [
      { model: 'gpt-4o', percentage: 22 },
      { model: 'gpt-4o-mini', percentage: 18 },
      { model: 'claude-3.5-sonnet', percentage: 16 },
      { model: 'claude-3-haiku', percentage: 12 },
      { model: 'gemini-1.5-flash', percentage: 15 },
      { model: 'gemini-1.5-pro', percentage: 8 },
      { model: 'llama-3.1-70b', percentage: 5 },
      { model: 'other', percentage: 4 },
    ],
    summary: {
      totalRequests: hours === 1 ? 52000 : hours === 6 ? 312000 : 1243789,
      avgLatency: 142,
      p50Latency: 128,
      p95Latency: 245,
      p99Latency: 380,
      errorRate: 0.23,
      totalTokensIn: hours === 1 ? 2500000 : hours === 6 ? 15000000 : 60000000,
      totalTokensOut: hours === 1 ? 800000 : hours === 6 ? 4800000 : 19200000,
      estimatedCost: hours === 1 ? 12.5 : hours === 6 ? 75.0 : 298.5,
    },
    range,
    generatedAt: new Date().toISOString(),
  };

  return NextResponse.json(metrics);
}
