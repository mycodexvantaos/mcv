/**
 * 🔒 MyCodeXvantaOS - DALL-E Image Provider
 *
 * OpenAI DALL-E image generation with native fallback.
 *
 * @module providers/image/image-dalle
 * @version 1.0.0
 */

export { DalleProvider } from './dalle-provider-cb';
export type { DalleConfig, GenerateOptions, GenerateResult, EditResult, VariationResult } from './dalle-provider-cb';

/**
 * Factory function to create DALL-E provider
 */
export function createDalleProvider(config: import('../../../packages/capabilities/types').ProviderConfig<any> = {}): DalleProvider {
  return new DalleProvider({
    id: config.id || 'dalle-image',
    name: config.name || 'DALL-E Image',
    mode: config.mode || 'hybrid',
    providerMode: config.providerMode || 'external',
    config: config.config || {},
    fallback: config.fallback,
  });
}

/**
 * Initialize DALL-E provider
 */
export async function initializeDalleProvider(
  config: import('../../../packages/capabilities/types').ProviderConfig<any> = {}
): Promise<DalleProvider> {
  const provider = createDalleProvider(config);
  await provider.initialize();
  return provider;
}

/**
 * Default export
 */
export { DalleProvider as default };
