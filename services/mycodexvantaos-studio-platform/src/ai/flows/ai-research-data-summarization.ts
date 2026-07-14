'use server';
/**
 * @fileOverview AI Research Data Summarization flow.
 *
 * Refactored to follow MyCodexVantaOS Provider Architecture:
 * - Uses Provider abstraction layer instead of direct Genkit dependency
 * - No hardcoded API key requirements
 * - Falls back to native provider when no external provider is configured
 *
 * - summarizeResearchData - A function that handles the research data summarization process.
 * - ResearchDataSummarizationInput - The input type for the summarizeResearchData function.
 * - ResearchDataSummarizationOutput - The return type for the summarizeResearchData function.
 */

import { generateText, hasAdvancedAI, getActiveProvider } from '@/ai/genkit';

// Input/Output types
export interface ResearchDataSummarizationInput {
  researchData: string;
}

export interface ResearchDataSummarizationOutput {
  summary: string;
}

/**
 * Build the prompt for research data summarization
 */
function buildPrompt(input: ResearchDataSummarizationInput): string {
  // Truncate very long research data for the prompt
  const maxLength = 32000;
  const data =
    input.researchData.length > maxLength
      ? input.researchData.slice(0, maxLength) + '\n...[truncated]'
      : input.researchData;

  return `You are an expert researcher and market analyst specializing in code editor ecosystems.
Your task is to analyze the provided research data, market trends, and editor ecosystem metrics to extract key insights and generate a comprehensive overview.
The summary should be concise, highlight the most important findings, and be structured for quick understanding by other researchers.

Research Data:
${data}

Please provide a comprehensive summary of the key insights and trends identified in the data.

Format your response as:
## Summary
[Overview of the research]

## Key Findings
- [Finding 1]
- [Finding 2]
- [Finding 3]

## Trends
- [Trend 1]
- [Trend 2]

## Recommendations
[Actionable recommendations based on the data]`;
}

/**
 * Summarize research data
 * Uses the Provider abstraction layer - no direct API key dependency
 */
export async function summarizeResearchData(
  input: ResearchDataSummarizationInput
): Promise<ResearchDataSummarizationOutput> {
  // For native provider, provide a structured template response
  if (!hasAdvancedAI()) {
    return {
      summary: generateNativeSummary(input.researchData),
    };
  }

  try {
    const prompt = buildPrompt(input);
    const response = await generateText(prompt, {
      maxTokens: 4096,
      temperature: 0.5,
    });

    return {
      summary: response.text,
    };
  } catch (error: any) {
    const provider = getActiveProvider();
    const advancedHint = hasAdvancedAI()
      ? ''
      : ' Tip: Configure LLM_PROVIDER and corresponding API key for advanced summarization capabilities.';

    throw new Error(`Research data summarization failed: ${error.message}.${advancedHint}`);
  }
}

/**
 * Generate a native summary for when no external AI is available
 */
function generateNativeSummary(data: string): string {
  // Simple statistical summary
  const lines = data.split('\n').length;
  const words = data.split(/\s+/).length;
  const chars = data.length;

  // Try to extract key terms
  const terms = extractKeyTerms(data);

  return `## Summary
Research data has been processed using the native provider.

**Data Statistics:**
- Lines: ${lines.toLocaleString()}
- Words: ${words.toLocaleString()}
- Characters: ${chars.toLocaleString()}

## Key Terms Detected
${terms.map((t) => `- ${t}`).join('\n')}

## Note
Configure an external LLM provider (LLM_PROVIDER + API key) for advanced AI-powered summarization and analysis.

Available providers:
- llm-gemini (Google Gemini API)
- llm-openai (OpenAI API)
- llm-anthropic (Anthropic API)
- llm-ollama (Local Ollama)`;
}

/**
 * Extract key terms from text using simple frequency analysis
 */
function extractKeyTerms(text: string, maxTerms: number = 10): string[] {
  // Remove common words
  const stopWords = new Set([
    'the',
    'a',
    'an',
    'and',
    'or',
    'but',
    'in',
    'on',
    'at',
    'to',
    'for',
    'of',
    'with',
    'by',
    'from',
    'as',
    'is',
    'was',
    'are',
    'were',
    'been',
    'be',
    'have',
    'has',
    'had',
    'do',
    'does',
    'did',
    'will',
    'would',
    'could',
    'should',
    'may',
    'might',
    'must',
    'shall',
    'can',
    'need',
    'dare',
    'ought',
    'used',
    'this',
    'that',
    'these',
    'those',
    'it',
    'its',
    'their',
    'they',
    'we',
    'our',
    'you',
    'your',
    'he',
    'she',
    'him',
    'her',
    'his',
  ]);

  // Extract words
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stopWords.has(w));

  // Count frequencies
  const freq: Record<string, number> = {};
  for (const word of words) {
    freq[word] = (freq[word] || 0) + 1;
  }

  // Sort by frequency and return top terms
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxTerms)
    .map(([term]) => term);
}
