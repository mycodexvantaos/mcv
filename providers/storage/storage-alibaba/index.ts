/**
 * Factory function for AlibabaOSSProvider
 */

import { AlibabaOSSProvider } from './alibaba-oss-provider-cb';
import type { AlibabaOSSConfig } from './alibaba-oss-provider-cb';
import { RuntimeMode, ProviderMode } from '../../../packages/capabilities/types';
import type { ProviderConfig } from '../../../packages/capabilities/types';

export { AlibabaOSSProvider } from './alibaba-oss-provider-cb';
export type { AlibabaOSSConfig } from './alibaba-oss-provider-cb';

/**
 * Create a AlibabaOSSProvider instance with the given configuration.
 */
export function createAlibabaOSSProvider(config: Partial<ProviderConfig<AlibabaOSSConfig>> = {}): AlibabaOSSProvider {
  const providerConfig: ProviderConfig<AlibabaOSSConfig> = {
    id: config.id || 'alibaba-oss-provider-cb',
    name: config.name || 'AlibabaOSSProvider',
    mode: config.mode || RuntimeMode.HYBRID,
    providerMode: config.providerMode || ProviderMode.EXTERNAL,
    config: (config.config || {}) as AlibabaOSSConfig,
    fallback: config.fallback,
  };

  return new AlibabaOSSProvider(providerConfig);
}

export default createAlibabaOSSProvider;
