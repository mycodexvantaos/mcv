/**
 * Factory function for GoogleAudioProvider
 */

import { GoogleAudioProvider } from './google-audio-provider-cb';
import type { GoogleAudioConfig } from './google-audio-provider-cb';
import { RuntimeMode, ProviderMode } from '../../../packages/capabilities/types';
import type { ProviderConfig } from '../../../packages/capabilities/types';

export { GoogleAudioProvider } from './google-audio-provider-cb';
export type { GoogleAudioConfig } from './google-audio-provider-cb';

/**
 * Create a GoogleAudioProvider instance with the given configuration.
 */
export function createGoogleAudioProvider(config: Partial<ProviderConfig<GoogleAudioConfig>> = {}): GoogleAudioProvider {
  const providerConfig: ProviderConfig<GoogleAudioConfig> = {
    id: config.id || 'google-audio-provider-cb',
    name: config.name || 'GoogleAudioProvider',
    mode: config.mode || RuntimeMode.HYBRID,
    providerMode: config.providerMode || ProviderMode.EXTERNAL,
    config: (config.config || {}) as GoogleAudioConfig,
    fallback: config.fallback,
  };

  return new GoogleAudioProvider(providerConfig);
}

export default createGoogleAudioProvider;
