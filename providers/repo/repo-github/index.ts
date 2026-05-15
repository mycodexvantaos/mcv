/**
 * Factory function for GitHubRepoProvider
 */

import { GitHubRepoProvider } from './github-repo-provider-cb';
import type { GitHubRepoConfig } from './github-repo-provider-cb';
import { RuntimeMode, ProviderMode } from '../../../packages/capabilities/types';
import type { ProviderConfig } from '../../../packages/capabilities/types';

export { GitHubRepoProvider } from './github-repo-provider-cb';
export type { GitHubRepoConfig } from './github-repo-provider-cb';

/**
 * Create a GitHubRepoProvider instance with the given configuration.
 */
export function createGitHubRepoProvider(
  config: Partial<ProviderConfig<GitHubRepoConfig>> = {}
): GitHubRepoProvider {
  const providerConfig: ProviderConfig<GitHubRepoConfig> = {
    id: config.id || 'github-repo-provider-cb',
    name: config.name || 'GitHubRepoProvider',
    mode: config.mode || RuntimeMode.HYBRID,
    providerMode: config.providerMode || ProviderMode.EXTERNAL,
    config: (config.config || {}) as GitHubRepoConfig,
    fallback: config.fallback,
  };

  return new GitHubRepoProvider(providerConfig);
}

export default createGitHubRepoProvider;
