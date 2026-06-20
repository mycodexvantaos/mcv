/**
 * @fileoverview Basic AI Content Detection Example
 *
 * Demonstrates using the Humaniser engine to detect AI-generated
 * content in text with native (zero-dependency) mode.
 *
 * Usage:
 *   npx ts-node examples/basic-detection.ts
 */

import { HumaniserEngine, ContentLabel } from '../src';

async function main() {
  // Initialize engine in native mode (no API key needed)
  const engine = new HumaniserEngine({ mode: 'native' });
  await engine.initialize();

  // Example 1: Human-written text
  const humanText = `I went to the coffee shop this morning and the barista remembered my order. 
It's kind of funny how you become a regular without even noticing. 
Anyway, the latte was great as usual and I got some work done.`;

  const humanResult = await engine.detect(humanText);
  console.log('=== Human Text Analysis ===');
  console.log(`Label: ${humanResult.label}`);
  console.log(`AI Score: ${(humanResult.aiScore * 100).toFixed(1)}%`);
  console.log(`Confidence: ${(humanResult.confidence * 100).toFixed(1)}%`);
  console.log(`Explanation: ${humanResult.explanation}`);
  console.log();

  // Example 2: AI-generated text
  const aiText = `Furthermore, it is important to note that the implementation of this strategy 
facilitates optimal outcomes across all relevant parameters. Consequently, stakeholders should 
leverage these methodologies to maximize efficiency and ensure comprehensive coverage. 
Additionally, the utilization of best practices demonstrates a commitment to excellence.`;

  const aiResult = await engine.detect(aiText);
  console.log('=== AI Text Analysis ===');
  console.log(`Label: ${aiResult.label}`);
  console.log(`AI Score: ${(aiResult.aiScore * 100).toFixed(1)}%`);
  console.log(`Confidence: ${(aiResult.confidence * 100).toFixed(1)}%`);
  console.log(`Explanation: ${aiResult.explanation}`);
  console.log();

  // Per-sentence breakdown
  console.log('=== Per-Sentence Breakdown ===');
  aiResult.sentences.forEach((s) => {
    const icon = s.label === ContentLabel.AI ? '🔴' : s.label === ContentLabel.HUMAN ? '🟢' : '🟡';
    console.log(`${icon} [${s.label.toUpperCase()} ${(s.aiScore * 100).toFixed(0)}%] ${s.text}`);
  });

  await engine.shutdown();
}

main().catch(console.error);
