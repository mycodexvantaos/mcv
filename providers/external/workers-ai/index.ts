import { WorkersAIProvider } from './workers-ai-provider-cb';
import type { WorkersAIConfig } from './workers-ai-provider-cb';
/**
 * 🔒 MyCodexVantaOS - Cloudflare Workers AI Provider Exports
 *
 * @module providers/external/workers-ai
 * @version 1.0.0
 */

export { WorkersAIProvider, default } from './workers-ai-provider-cb';
export type {
  WorkersAIConfig,
  WorkersAILLMRequest,
  WorkersAILLMResponse,
  WorkersAIEmbeddingRequest,
  WorkersAIEmbeddingResponse,
} from './workers-ai-provider-cb';

/**
 * Create a Workers AI provider instance
 */
export function createWorkersAIProvider(
  id: string = 'workers-ai',
  config?: Partial<WorkersAIConfig>
) {
  const { WorkersAIProvider } = require('./workers-ai-provider-cb');

  return new WorkersAIProvider(id, 'Cloudflare Workers AI', {
    enabled: true,
    config: config || {},
  });
}

/**
 * Initialize and return a Workers AI provider
 */
export async function initializeWorkersAIProvider(
  id: string = 'workers-ai',
  config?: Partial<WorkersAIConfig>
) {
  const provider = createWorkersAIProvider(id, config);
  await provider.initialize();
  return provider;
}
