/**
 * Factory function for FirebaseAuthProvider
 */

import { FirebaseAuthProvider } from './firebase-auth-provider-cb';
import type { FirebaseAuthConfig } from './firebase-auth-provider-cb';
import { RuntimeMode, ProviderMode } from '../../../packages/capabilities/types';
import type { ProviderConfig } from '../../../packages/capabilities/types';

export { FirebaseAuthProvider } from './firebase-auth-provider-cb';
export type { FirebaseAuthConfig } from './firebase-auth-provider-cb';

/**
 * Create a FirebaseAuthProvider instance with the given configuration.
 */
export function createFirebaseAuthProvider(config: Partial<ProviderConfig<FirebaseAuthConfig>> = {}): FirebaseAuthProvider {
  const providerConfig: ProviderConfig<FirebaseAuthConfig> = {
    id: config.id || 'firebase-auth-provider-cb',
    name: config.name || 'FirebaseAuthProvider',
    mode: config.mode || RuntimeMode.HYBRID,
    providerMode: config.providerMode || ProviderMode.EXTERNAL,
    config: (config.config || {}) as FirebaseAuthConfig,
    fallback: config.fallback,
  };

  return new FirebaseAuthProvider(providerConfig);
}

export default createFirebaseAuthProvider;
