/**
 * Factory function for ArgoCDProvider
 */

import { ArgoCDProvider } from './argocd-provider-cb';
import type { ArgoCDConfig } from './argocd-provider-cb';
import { RuntimeMode, ProviderMode } from '../../../packages/capabilities/types';
import type { ProviderConfig } from '../../../packages/capabilities/types';

export { ArgoCDProvider } from './argocd-provider-cb';
export type { ArgoCDConfig } from './argocd-provider-cb';

/**
 * Create a ArgoCDProvider instance with the given configuration.
 */
export function createArgoCDProvider(config: Partial<ProviderConfig<ArgoCDConfig>> = {}): ArgoCDProvider {
  const providerConfig: ProviderConfig<ArgoCDConfig> = {
    id: config.id || 'argocd-provider-cb',
    name: config.name || 'ArgoCDProvider',
    mode: config.mode || RuntimeMode.HYBRID,
    providerMode: config.providerMode || ProviderMode.EXTERNAL,
    config: (config.config || {}) as ArgoCDConfig,
    fallback: config.fallback,
  };

  return new ArgoCDProvider(providerConfig);
}

export default createArgoCDProvider;
