/**
 * MyCodexVantaOS CI Reporter: service-catalog-reporter
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

export interface ReportData {
  reporter: string;
  timestamp: string;
  platform: string;
  results: unknown[];
  summary: Record<string, unknown>;
}

export function generateReport(results: unknown[]): ReportData {
  return {
    reporter: 'service-catalog-reporter',
    timestamp: new Date().toISOString(),
    platform: 'mycodexvantaos',
    results,
    summary: {
      total: results.length,
      passed: 0,
      failed: 0,
    },
  };
}

export function saveReport(report: ReportData, outputDir: string): void {
  mkdirSync(outputDir, { recursive: true });
  const outputPath = join(outputDir, 'service-catalog-reporter-report.json');
  writeFileSync(outputPath, JSON.stringify(report, null, 2));
}
