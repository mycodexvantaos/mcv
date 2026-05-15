/**
 * Factory function for K8sNativeSecretsProvider
 */

import { K8sNativeSecretsProvider } from './k8s-native-secrets-provider-cb';
import type { K8sNativeSecretsConfig } from './k8s-native-secrets-provider-cb';
import { RuntimeMode, ProviderMode } from '../../../packages/capabilities/types';
import type { ProviderConfig } from '../../../packages/capabilities/types';

export { K8sNativeSecretsProvider } from './k8s-native-secrets-provider-cb';
export type { K8sNativeSecretsConfig } from './k8s-native-secrets-provider-cb';

/**
 * Create a K8sNativeSecretsProvider instance with the given configuration.
 */
export function createK8sNativeSecretsProvider(
  config: Partial<ProviderConfig<K8sNativeSecretsConfig>> = {}
): K8sNativeSecretsProvider {
  const providerConfig: ProviderConfig<K8sNativeSecretsConfig> = {
    id: config.id || 'k8s-native-secrets-provider-cb',
    name: config.name || 'K8sNativeSecretsProvider',
    mode: config.mode || RuntimeMode.NATIVE,
    providerMode: config.providerMode || ProviderMode.NATIVE,
    config: (config.config || {}) as K8sNativeSecretsConfig,
    fallback: config.fallback,
  };

  return new K8sNativeSecretsProvider(providerConfig);
}

export default createK8sNativeSecretsProvider;
