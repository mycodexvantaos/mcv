'use server';
/**
 * @fileOverview Genkit flow for AI-powered content detection enhancement.
 *
 * Uses LLM to provide more nuanced AI content detection when native
 * detection yields uncertain results. Falls back gracefully when
 * no API key is available.
 *
 * - humaniserDetectFlow - Enhanced AI content detection flow
 * - HumaniserDetectInput - Input schema
 * - HumaniserDetectOutput - Output schema
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SentenceAnalysisSchema = z.object({
  text: z.string().describe('The sentence text'),
  aiScore: z.number().min(0).max(1).describe('AI probability score 0-1'),
  label: z.enum(['ai', 'human', 'mixed', 'uncertain']).describe('Classification label'),
  confidence: z.number().min(0).max(1).describe('Confidence in the classification'),
  explanation: z.string().describe('Why this label was assigned'),
});

const HumaniserDetectInputSchema = z.object({
  text: z.string().describe('The text to analyze for AI-generated content'),
  nativeResult: z
    .object({
      overallAiScore: z.number().optional().describe('Native detection AI score'),
      overallLabel: z.string().optional().describe('Native detection label'),
    })
    .optional()
    .describe('Optional native detection result for context'),
});
export type HumaniserDetectInput = z.infer<typeof HumaniserDetectInputSchema>;

const HumaniserDetectOutputSchema = z.object({
  overallLabel: z
    .enum(['ai', 'human', 'mixed', 'uncertain'])
    .describe('Overall classification for the text'),
  overallAiScore: z
    .number()
    .min(0)
    .max(1)
    .describe('Overall AI probability score (0=human, 1=AI)'),
  overallConfidence: z
    .number()
    .min(0)
    .max(1)
    .describe('Confidence in the overall classification'),
  sentences: z
    .array(SentenceAnalysisSchema)
    .describe('Per-sentence analysis results'),
  explanation: z.string().describe('Overall explanation of the detection result'),
});
export type HumaniserDetectOutput = z.infer<typeof HumaniserDetectOutputSchema>;

export async function humaniserDetectFlow(
  input: HumaniserDetectInput
): Promise<HumaniserDetectOutput> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error(
      'GEMINI_API_KEY environment variable is not set. Native detection will be used as fallback.'
    );
  }

  try {
    return await detectFlow(input);
  } catch (e: any) {
    if (e.message?.includes('API key not valid')) {
      throw new Error(
        'The provided GEMINI_API_KEY is invalid. Please check your .env file.'
      );
    }
    throw e;
  }
}

const detectPrompt = ai.definePrompt({
  name: 'humaniserDetectPrompt',
  input: { schema: HumaniserDetectInputSchema },
  output: { schema: HumaniserDetectOutputSchema },
  prompt: `You are an expert linguist specializing in detecting AI-generated content. Your task is to analyze the provided text and classify each sentence as AI-generated, human-written, mixed, or uncertain.

For each sentence, consider these signals:
- **AI indicators**: Uniform sentence structure, predictable vocabulary, excessive use of transition words (furthermore, consequently, additionally), formal and formulaic phrasing, lack of personal voice, overly consistent sentence length
- **Human indicators**: Natural variation in structure, colloquial expressions, varied punctuation, personal anecdotes or opinions, inconsistent formatting, emotional language, hedging and qualifiers

{{#if nativeResult}}
Native detection context:
- Overall AI score: {{nativeResult.overallAiScore}}
- Overall label: {{nativeResult.overallLabel}}
{{/if}}

Text to analyze:
{{text}}

Provide a detailed per-sentence analysis with scores and explanations. Be objective and evidence-based in your assessment.`,
});

const detectFlow = ai.defineFlow(
  {
    name: 'humaniserDetectFlow',
    inputSchema: HumaniserDetectInputSchema,
    outputSchema: HumaniserDetectOutputSchema,
  },
  async (input) => {
    const { output } = await detectPrompt(input);
    if (!output) {
      throw new Error('Failed to get a response from the Humaniser detection AI.');
    }
    return output;
  }
);
