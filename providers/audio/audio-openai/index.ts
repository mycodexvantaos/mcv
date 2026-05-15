/**
 * 🔒 MyCodeXvantaOS - OpenAI Audio Provider
 *
 * OpenAI audio integration with native fallback.
 *
 * @module providers/audio/audio-openai
 * @version 1.0.0
 */

export { OpenAIAudioProvider } from './openai-audio-provider-cb';
export type { OpenAIAudioConfig, TTSOptions, TTSResult, STTOptions, STTResult } from './openai-audio-provider-cb';

/**
 * Factory function to create OpenAI audio provider
 */
export function createOpenAIAudioProvider(config: import('../../../packages/capabilities/types').ProviderConfig<any> = {}): OpenAIAudioProvider {
  return new OpenAIAudioProvider({
    id: config.id || 'openai-audio',
    name: config.name || 'OpenAI Audio',
    mode: config.mode || 'hybrid',
    providerMode: config.providerMode || 'external',
    config: config.config || {},
    fallback: config.fallback,
  });
}

/**
 * Initialize OpenAI audio provider
 */
export async function initializeOpenAIAudioProvider(
  config: import('../../../packages/capabilities/types').ProviderConfig<any> = {}
): Promise<OpenAIAudioProvider> {
  const provider = createOpenAIAudioProvider(config);
  await provider.initialize();
  return provider;
}

/**
 * Default export
 */
export { OpenAIAudioProvider as default };
