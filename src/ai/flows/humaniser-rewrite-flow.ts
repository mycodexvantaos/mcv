'use server';
/**
 * @fileOverview Genkit flow for AI-powered content humanisation/rewriting.
 *
 * Uses LLM to rewrite AI-flagged content to sound more natural while
 * preserving meaning. Supports multiple rewrite styles.
 *
 * - humaniserRewriteFlow - Enhanced content rewriting flow
 * - HumaniserRewriteInput - Input schema
 * - HumaniserRewriteOutput - Output schema
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SentenceRewriteSchema = z.object({
  original: z.string().describe('Original sentence text'),
  rewritten: z.string().describe('Rewritten sentence text'),
  changes: z.array(z.string()).describe('List of changes made'),
});

const HumaniserRewriteInputSchema = z.object({
  text: z.string().describe('The text to humanise'),
  style: z
    .enum(['conversational', 'professional', 'academic', 'creative', 'neutral'])
    .default('neutral')
    .describe('Rewrite style preference'),
  targetSentenceIndices: z
    .array(z.number())
    .optional()
    .describe('Specific sentence indices to rewrite (0-based). If omitted, rewrite all AI-flagged sentences.'),
  preserveTechnicalTerms: z
    .boolean()
    .default(true)
    .describe('Whether to preserve technical terminology'),
  formalityLevel: z
    .enum(['casual', 'semi-formal', 'formal'])
    .default('semi-formal')
    .describe('Target formality level'),
});
export type HumaniserRewriteInput = z.infer<typeof HumaniserRewriteInputSchema>;

const HumaniserRewriteOutputSchema = z.object({
  humanisedText: z.string().describe('The complete humanised text'),
  sentenceRewrites: z
    .array(SentenceRewriteSchema)
    .describe('Per-sentence rewrite results'),
  improvement: z
    .number()
    .min(0)
    .max(1)
    .describe('Estimated improvement in naturalness (0-1)'),
  style: z.string().describe('The rewrite style used'),
  summary: z.string().describe('Summary of changes made'),
});
export type HumaniserRewriteOutput = z.infer<typeof HumaniserRewriteOutputSchema>;

export async function humaniserRewriteFlow(
  input: HumaniserRewriteInput
): Promise<HumaniserRewriteOutput> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error(
      'GEMINI_API_KEY environment variable is not set. Native rewriting will be used as fallback.'
    );
  }

  try {
    return await rewriteFlow(input);
  } catch (e: any) {
    if (e.message?.includes('API key not valid')) {
      throw new Error(
        'The provided GEMINI_API_KEY is invalid. Please check your .env file.'
      );
    }
    throw e;
  }
}

const rewritePrompt = ai.definePrompt({
  name: 'humaniserRewritePrompt',
  input: { schema: HumaniserRewriteInputSchema },
  output: { schema: HumaniserRewriteOutputSchema },
  prompt: `You are an expert editor specializing in making AI-generated text sound more natural and human-written. Your task is to rewrite the provided text to remove AI-typical patterns while preserving the original meaning.

**Rewrite style**: {{style}}
**Formality level**: {{formalityLevel}}
**Preserve technical terms**: {{preserveTechnicalTerms}}
{{#if targetSentenceIndices}}
**Target sentences** (0-indexed): {{targetSentenceIndices}}
{{else}}
Rewrite all sentences that sound AI-generated.
{{/if}}

Key AI patterns to remove:
- Excessive use of formal transitions (furthermore, consequently, additionally, moreover)
- Formulaic sentence structures ("It is important to note that...")
- Overly uniform sentence length and complexity
- Buzzwords and corporate jargon (leverage, utilize, facilitate, synergy, paradigm)
- Hedging phrases that add no meaning ("It is worth noting that...")
- Repetitive sentence openings

Key principles:
- Preserve the original meaning and key information
- Make the text flow naturally as if written by a human
- Vary sentence structure and length
- Use more direct and concise language
- Add subtle personality without being unprofessional

Text to humanise:
{{text}}

Provide the complete humanised text, per-sentence changes, and a summary of improvements.`,
});

const rewriteFlow = ai.defineFlow(
  {
    name: 'humaniserRewriteFlow',
    inputSchema: HumaniserRewriteInputSchema,
    outputSchema: HumaniserRewriteOutputSchema,
  },
  async (input) => {
    const { output } = await rewritePrompt(input);
    if (!output) {
      throw new Error('Failed to get a response from the Humaniser rewrite AI.');
    }
    return output;
  }
);
