/**
 * @fileoverview Batch Analysis Example
 *
 * Demonstrates analyzing multiple texts in batch,
 * generating reports with grades and recommendations.
 *
 * Usage:
 *   npx ts-node examples/batch-analysis.ts
 */

import { HumaniserEngine, generateReport, computeGrade } from '../src';

async function main() {
  const engine = new HumaniserEngine({ mode: 'native' });
  await engine.initialize();

  const texts = [
    {
      label: 'Human Blog Post',
      text: "So I've been thinking about this for a while and honestly I think the best approach is just to start small. You don't need some fancy setup — just pick a project and go. That's what worked for me anyway.",
    },
    {
      label: 'AI Technical Doc',
      text: 'Furthermore, it is essential to leverage the comprehensive suite of tools available within the ecosystem to facilitate seamless integration. Consequently, organizations must implement robust methodologies to ensure optimal performance across all deployment environments.',
    },
    {
      label: 'Mixed Content',
      text: "I really love the new design. Furthermore, the implementation of responsive layouts ensures optimal user experience across all device form factors. It's pretty cool how it all works together. Additionally, the utilization of modern CSS frameworks facilitates maintainable codebases.",
    },
  ];

  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║          MyCodexVantaOS AI Humaniser — Batch Report         ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log();

  for (const { label, text } of texts) {
    const result = await engine.detect(text);
    const report = generateReport(result);

    console.log(`┌─ ${label} ─────────────────────────────────────`);
    console.log(`│ Grade:       ${report.grade}`);
    console.log(`│ Verdict:     ${report.verdict}`);
    console.log(`│ AI %:        ${report.aiPercentage}%`);
    console.log(`│ Human %:     ${report.humanPercentage}%`);
    console.log(`│ Naturalness: ${(report.naturalness * 100).toFixed(1)}%`);
    console.log(
      `│ Breakdown:   ${report.sentenceBreakdown.ai} AI / ${report.sentenceBreakdown.human} Human / ${report.sentenceBreakdown.mixed} Mixed / ${report.sentenceBreakdown.uncertain} Uncertain`
    );
    console.log('│');
    console.log('│ Recommendations:');
    report.recommendations.forEach((r) => console.log(`│   • ${r}`));
    console.log('│');
    console.log('│ Top AI-Flagged Sentences:');
    report.topAISentences.forEach((s) => {
      console.log(`│   ${(s.aiScore * 100).toFixed(0)}% — ${s.text.substring(0, 60)}...`);
    });
    console.log('└──────────────────────────────────────────────────');
    console.log();
  }

  // Summary table
  console.log('=== Summary Table ===');
  console.log('Label                   | Grade | AI%  | Verdict');
  console.log('────────────────────────┼───────┼──────┤');

  for (const { label, text } of texts) {
    const result = await engine.detect(text);
    const grade = computeGrade(result.aiScore);
    console.log(
      `${label.padEnd(24)}| ${grade.padEnd(6)}| ${(result.aiScore * 100).toFixed(0).padStart(3)}% | ${result.label}`
    );
  }

  await engine.shutdown();
}

main().catch(console.error);
