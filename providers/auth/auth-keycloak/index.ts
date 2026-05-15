/**
 * Factory function for KeycloakAuthProvider
 */

import { KeycloakAuthProvider } from './keycloak-auth-provider-cb';
import type { KeycloakAuthConfig } from './keycloak-auth-provider-cb';
import { RuntimeMode, ProviderMode } from '../../../packages/capabilities/types';
import type { ProviderConfig } from '../../../packages/capabilities/types';

export { KeycloakAuthProvider } from './keycloak-auth-provider-cb';
export type { KeycloakAuthConfig } from './keycloak-auth-provider-cb';

/**
 * Create a KeycloakAuthProvider instance with the given configuration.
 */
export function createKeycloakAuthProvider(
  config: Partial<ProviderConfig<KeycloakAuthConfig>> = {}
): KeycloakAuthProvider {
  const providerConfig: ProviderConfig<KeycloakAuthConfig> = {
    id: config.id || 'keycloak-auth-provider-cb',
    name: config.name || 'KeycloakAuthProvider',
    mode: config.mode || RuntimeMode.HYBRID,
    providerMode: config.providerMode || ProviderMode.EXTERNAL,
    config: (config.config || {}) as KeycloakAuthConfig,
    fallback: config.fallback,
  };

  return new KeycloakAuthProvider(providerConfig);
}

export default createKeycloakAuthProvider;
