import { NextRequest, NextResponse } from 'next/server';

/**
 * @fileoverview Humaniser Report API Route
 *
 * POST /api/humaniser/report
 * Generates a comprehensive detection report with grades and recommendations.
 */

export async function POST(request: NextRequest) {
  try {
    const body: { detectionResult?: any } = await request.json();
    const { detectionResult } = body;

    if (!detectionResult) {
      return NextResponse.json(
        { error: 'Detection result is required for report generation' },
        { status: 400 }
      );
    }

    const { generateReport } = await import('@mycodexvantaos/ai-humaniser');

    const report = generateReport(detectionResult);

    return NextResponse.json(report);
  } catch (error: any) {
    console.error('[Humaniser Report API]', error);
    return NextResponse.json(
      { error: error.message || 'Report generation failed' },
      { status: 500 }
    );
  }
}
