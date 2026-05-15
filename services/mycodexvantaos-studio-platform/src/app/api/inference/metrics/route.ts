import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/inference/metrics
 * Returns time-series inference metrics for the past N hours.
 * Query params: hours=24 (default), modelId (optional filter)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const hours = parseInt(searchParams.get('hours') ?? '24', 10);
  const modelId = searchParams.get('modelId');

  const now = Date.now();
  const series = Array.from({ length: hours }, (_, i) => {
    const ts = new Date(now - (hours - 1 - i) * 3_600_000).toISOString();
    return {
      ts,
      requestsPerMin: Math.floor(60 + Math.random() * 80),
      latencyP50Ms: Math.floor(120 + Math.random() * 60),
      latencyP95Ms: Math.floor(180 + Math.random() * 80),
      latencyP99Ms: Math.floor(250 + Math.random() * 150),
      errorRate: parseFloat((Math.random() * 0.05).toFixed(4)),
      tokensIn: Math.floor(50_000 + Math.random() * 30_000),
      tokensOut: Math.floor(20_000 + Math.random() * 15_000),
      costUsd: parseFloat((Math.random() * 2.5).toFixed(4)),
      modelId: modelId ?? 'all',
    };
  });

  const summary = {
    totalRequests: series.reduce((s, r) => s + r.requestsPerMin * 60, 0),
    avgLatencyP95Ms: Math.round(series.reduce((s, r) => s + r.latencyP95Ms, 0) / series.length),
    avgErrorRate: parseFloat((series.reduce((s, r) => s + r.errorRate, 0) / series.length).toFixed(4)),
    totalCostUsd: parseFloat(series.reduce((s, r) => s + r.costUsd, 0).toFixed(2)),
    sloBreaches: series.filter(r => r.latencyP95Ms > 200).length,
  };

  return NextResponse.json({ success: true, data: { series, summary, modelId: modelId ?? 'all', hours } });
}
