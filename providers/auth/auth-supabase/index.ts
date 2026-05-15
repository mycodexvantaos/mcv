/**
 * Factory function for SupabaseAuthProvider
 */

import { SupabaseAuthProvider } from './supabase-auth-provider-cb';
import type { SupabaseAuthConfig } from './supabase-auth-provider-cb';
import { RuntimeMode, ProviderMode } from '../../../packages/capabilities/types';
import type { ProviderConfig } from '../../../packages/capabilities/types';

export { SupabaseAuthProvider } from './supabase-auth-provider-cb';
export type { SupabaseAuthConfig } from './supabase-auth-provider-cb';

/**
 * Create a SupabaseAuthProvider instance with the given configuration.
 */
export function createSupabaseAuthProvider(config: Partial<ProviderConfig<SupabaseAuthConfig>> = {}): SupabaseAuthProvider {
  const providerConfig: ProviderConfig<SupabaseAuthConfig> = {
    id: config.id || 'supabase-auth-provider-cb',
    name: config.name || 'SupabaseAuthProvider',
    mode: config.mode || RuntimeMode.HYBRID,
    providerMode: config.providerMode || ProviderMode.EXTERNAL,
    config: (config.config || {}) as SupabaseAuthConfig,
    fallback: config.fallback,
  };

  return new SupabaseAuthProvider(providerConfig);
}

export default createSupabaseAuthProvider;
