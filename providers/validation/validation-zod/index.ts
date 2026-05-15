/**
 * Factory function for ZodValidationProvider
 */

import { ZodValidationProvider } from './zod-validation-provider-cb';
import type { ZodValidationConfig } from './zod-validation-provider-cb';
import { RuntimeMode, ProviderMode } from '../../../packages/capabilities/types';
import type { ProviderConfig } from '../../../packages/capabilities/types';

export { ZodValidationProvider } from './zod-validation-provider-cb';
export type { ZodValidationConfig } from './zod-validation-provider-cb';

/**
 * Create a ZodValidationProvider instance with the given configuration.
 */
export function createZodValidationProvider(
  config: Partial<ProviderConfig<ZodValidationConfig>> = {}
): ZodValidationProvider {
  const providerConfig: ProviderConfig<ZodValidationConfig> = {
    id: config.id || 'zod-validation-provider-cb',
    name: config.name || 'ZodValidationProvider',
    mode: config.mode || RuntimeMode.NATIVE,
    providerMode: config.providerMode || ProviderMode.NATIVE,
    config: (config.config || {}) as ZodValidationConfig,
    fallback: config.fallback,
  };

  return new ZodValidationProvider(providerConfig);
}

export default createZodValidationProvider;
