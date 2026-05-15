/**
 * Factory function for OpenAIAudioProvider
 */

import { OpenAIAudioProvider } from './openai-audio-provider-cb';
import type { OpenAIAudioConfig } from './openai-audio-provider-cb';
import { RuntimeMode, ProviderMode } from '../../../packages/capabilities/types';
import type { ProviderConfig } from '../../../packages/capabilities/types';

export { OpenAIAudioProvider } from './openai-audio-provider-cb';
export type { OpenAIAudioConfig } from './openai-audio-provider-cb';

/**
 * Create a OpenAIAudioProvider instance with the given configuration.
 */
export function createOpenAIAudioProvider(
  config: Partial<ProviderConfig<OpenAIAudioConfig>> = {}
): OpenAIAudioProvider {
  const providerConfig: ProviderConfig<OpenAIAudioConfig> = {
    id: config.id || 'openai-audio-provider-cb',
    name: config.name || 'OpenAIAudioProvider',
    mode: config.mode || RuntimeMode.HYBRID,
    providerMode: config.providerMode || ProviderMode.EXTERNAL,
    config: (config.config || {}) as OpenAIAudioConfig,
    fallback: config.fallback,
  };

  return new OpenAIAudioProvider(providerConfig);
}

export default createOpenAIAudioProvider;
