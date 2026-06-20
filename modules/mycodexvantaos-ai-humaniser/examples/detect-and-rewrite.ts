/**
 * @fileoverview Detect and Rewrite Example
 *
 * Demonstrates the full detect-then-humanise workflow,
 * showing before/after comparison with side-by-side diff.
 *
 * Usage:
 *   npx ts-node examples/detect-and-rewrite.ts
 */

import { HumaniserEngine } from '../src';

async function main() {
  const engine = new HumaniserEngine({ mode: 'native' });
  await engine.initialize();

  const aiText = `Furthermore, it is important to note that the implementation of this strategy 
facilitates optimal outcomes across all relevant parameters. Consequently, stakeholders should 
leverage these methodologies to maximize efficiency and ensure comprehensive coverage. 
Additionally, the utilization of best practices demonstrates a commitment to excellence.`;

  console.log('=== Original Text ===');
  console.log(aiText);
  console.log();

  // Detect + Humanise in one call
  const { detection, humanisation } = await engine.detectAndHumanise(aiText);

  console.log('=== Detection Result ===');
  console.log(`Label: ${detection.label}`);
  console.log(`AI Score: ${(detection.aiScore * 100).toFixed(1)}%`);
  console.log(`AI Sentences: ${detection.stats.aiSentences}/${detection.stats.totalSentences}`);
  console.log();

  if (humanisation) {
    console.log('=== Humanised Text ===');
    console.log(humanisation.humanisedText);
    console.log();

    console.log('=== Change Summary ===');
    console.log(`Sentences rewritten: ${humanisation.changeSummary.sentencesRewritten}`);
    console.log(`Avg score improvement: ${(humanisation.changeSummary.avgScoreImprovement * 100).toFixed(1)}%`);
    console.log(
      `Overall AI score: ${(humanisation.changeSummary.overallScoreChange.before * 100).toFixed(1)}% → ${(humanisation.changeSummary.overallScoreChange.after * 100).toFixed(1)}%`
    );
    console.log();

    // Change categories
    console.log('=== Change Categories ===');
    humanisation.changeSummary.changeCategories.forEach((cat) => {
      console.log(`  ${cat.category} (${cat.count} changes)`);
      cat.examples.forEach((ex) => console.log(`    - ${ex}`));
    });
    console.log();

    // Diff view
    console.log('=== Diff View ===');
    humanisation.comparison.diffs.forEach((diff) => {
      const marker = diff.type === 'removed' ? '-' : diff.type === 'added' ? '+' : ' ';
      const text = diff.type === 'removed' ? diff.original : diff.type === 'added' ? diff.humanised : diff.original;
      console.log(`${marker} ${text}`);
    });
  } else {
    console.log('Text appears human — no rewriting needed.');
  }

  await engine.shutdown();
}

main().catch(console.error);
