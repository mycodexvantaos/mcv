/**
 * Factory function for JWTNativeAuthProvider
 */

import { JWTNativeAuthProvider } from './jwt-native-auth-provider-cb';
import type { JWTNativeAuthConfig } from './jwt-native-auth-provider-cb';
import { RuntimeMode, ProviderMode } from '../../../packages/capabilities/types';
import type { ProviderConfig } from '../../../packages/capabilities/types';

export { JWTNativeAuthProvider } from './jwt-native-auth-provider-cb';
export type { JWTNativeAuthConfig } from './jwt-native-auth-provider-cb';

/**
 * Create a JWTNativeAuthProvider instance with the given configuration.
 */
export function createJWTNativeAuthProvider(
  config: Partial<ProviderConfig<JWTNativeAuthConfig>> = {}
): JWTNativeAuthProvider {
  const providerConfig: ProviderConfig<JWTNativeAuthConfig> = {
    id: config.id || 'jwt-native-auth-provider-cb',
    name: config.name || 'JWTNativeAuthProvider',
    mode: config.mode || RuntimeMode.NATIVE,
    providerMode: config.providerMode || ProviderMode.NATIVE,
    config: (config.config || {}) as JWTNativeAuthConfig,
    fallback: config.fallback,
  };

  return new JWTNativeAuthProvider(providerConfig);
}

export default createJWTNativeAuthProvider;
