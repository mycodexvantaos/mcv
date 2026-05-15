/**
 * 🔒 MyCodeXvantaOS - Google Audio Provider
 *
 * Google audio integration with native fallback.
 *
 * @module providers/audio/audio-google
 * @version 1.0.0
 */

export { GoogleAudioProvider } from './google-audio-provider-cb';
export type { GoogleAudioConfig, TTSOptions, TTSResult, STTOptions, STTResult } from './google-audio-provider-cb';

/**
 * Factory function to create Google audio provider
 */
export function createGoogleAudioProvider(config: import('../../../packages/capabilities/types').ProviderConfig<any> = {}): GoogleAudioProvider {
  return new GoogleAudioProvider({
    id: config.id || 'google-audio',
    name: config.name || 'Google Audio',
    mode: config.mode || 'hybrid',
    providerMode: config.providerMode || 'external',
    config: config.config || {},
    fallback: config.fallback,
  });
}

/**
 * Initialize Google audio provider
 */
export async function initializeGoogleAudioProvider(
  config: import('../../../packages/capabilities/types').ProviderConfig<any> = {}
): Promise<GoogleAudioProvider> {
  const provider = createGoogleAudioProvider(config);
  await provider.initialize();
  return provider;
}

/**
 * Default export
 */
export { GoogleAudioProvider as default };
