'use server';
/**
 * @fileOverview A Genkit flow for summarizing large volumes of research data, market trends, and editor ecosystem metrics.
 *
 * - summarizeResearchData - A function that handles the research data summarization process.
 * - ResearchDataSummarizationInput - The input type for the summarizeResearchData function.
 * - ResearchDataSummarizationOutput - The return type for the summarizeResearchData function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Define the input schema for the research data summarization flow.
const ResearchDataSummarizationInputSchema = z.object({
  researchData: z
    .string()
    .describe(
      'Large volumes of research data, market trends, and editor ecosystem metrics as a single text block.'
    ),
});
export type ResearchDataSummarizationInput = z.infer<typeof ResearchDataSummarizationInputSchema>;

// Define the output schema for the research data summarization flow.
const ResearchDataSummarizationOutputSchema = z.object({
  summary: z
    .string()
    .describe('A comprehensive summary of the provided research data, highlighting key insights.'),
});
export type ResearchDataSummarizationOutput = z.infer<typeof ResearchDataSummarizationOutputSchema>;

// Exported wrapper function to call the Genkit flow.
export async function summarizeResearchData(
  input: ResearchDataSummarizationInput
): Promise<ResearchDataSummarizationOutput> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error(
      'The GEMINI_API_KEY environment variable is not set. Please add it to your .env file to use AI features.'
    );
  }
  try {
    return await summarizeResearchDataFlow(input);
  } catch (e: any) {
    if (e.message.includes('API key not valid')) {
      throw new Error(
        'The provided GEMINI_API_KEY is invalid. Please check your .env file and provide a valid key from Google AI Studio.'
      );
    }
    // Re-throw other errors
    throw e;
  }
}

// Define the prompt for the AI to summarize research data.
const summarizeResearchDataPrompt = ai.definePrompt({
  name: 'summarizeResearchDataPrompt',
  input: { schema: ResearchDataSummarizationInputSchema },
  output: { schema: ResearchDataSummarizationOutputSchema },
  prompt: `You are an expert researcher and market analyst specializing in code editor ecosystems.
Your task is to analyze the provided research data, market trends, and editor ecosystem metrics to extract key insights and generate a comprehensive overview.
The summary should be concise, highlight the most important findings, and be structured for quick understanding by other researchers.

Research Data:
{{{researchData}}}

Please provide a comprehensive summary of the key insights and trends identified in the data.`,
});

// Define the Genkit flow for research data summarization.
const summarizeResearchDataFlow = ai.defineFlow(
  {
    name: 'summarizeResearchDataFlow',
    inputSchema: ResearchDataSummarizationInputSchema,
    outputSchema: ResearchDataSummarizationOutputSchema,
  },
  async (input) => {
    const { output } = await summarizeResearchDataPrompt(input);
    if (!output) {
      throw new Error('Failed to generate summary.');
    }
    return output;
  }
);
