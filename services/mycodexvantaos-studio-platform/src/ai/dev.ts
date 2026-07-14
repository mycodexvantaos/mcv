/**
 * services/mycodexvantaos-studio-platform/src/ai/dev.ts
 *
 * Development entry point for AI capabilities
 * Following MyCodexVantaOS Provider Architecture
 *
 * This module initializes the AI system with available providers.
 * No external API keys are required - native provider is always available.
 */

import { config } from 'dotenv';
config();

import { initializeAI } from '@/ai/genkit';

// Import all AI flows (they register themselves)
import '@/ai/flows/ai-agent-code-generation-refactoring';
import '@/ai/flows/ai-research-data-summarization';
import '@/ai/flows/conversational-ai-assistant';
import '@/ai/flows/ai-code-completion-flow';
import '@/ai/flows/vulnerability-scanner-flow';

/**
 * Initialize AI system for development
 * Called at application startup
 */
async function main() {
  console.log('[AI Dev] Initializing AI system...');

  try {
    await initializeAI();
    console.log('[AI Dev] AI system initialized successfully');
    console.log('[AI Dev] Native provider always available');
    console.log(
      '[AI Dev] Configure LLM_PROVIDER, GOOGLE_GENAI_API_KEY, or OPENAI_API_KEY for advanced capabilities'
    );
  } catch (error) {
    console.error('[AI Dev] Failed to initialize AI system:', error);
    process.exit(1);
  }
}

// Run initialization
main();

export { initializeAI };
