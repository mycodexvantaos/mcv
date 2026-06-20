/**
 * Controlled vocabulary derived from Namespace Governance Closure Spec
 * (8BFFa5JRUNmGUthU.md §I.7). Single source of truth for plane, domain and
 * function tokens. Frozen to guarantee referential immutability — vocabulary
 * drift is a CI-blocking governance violation (§I.0).
 *
 * Rationale: the spec defines these as a closed set; encoding them as frozen
 * data (not scattered string literals) makes naming validation provably
 * exhaustive and keeps a single auditable mapping for drift control.
 */

/** @type {Readonly<Record<string, 'control-plane'|'product-plane'>>} */
export const PLANE_BY_NAMESPACE = Object.freeze({
  mycodexvantaos: 'control-plane',
  softwareos: 'product-plane',
});

/** Canonical namespace tokens (§I.2.1). @type {readonly string[]} */
export const NAMESPACES = Object.freeze(Object.keys(PLANE_BY_NAMESPACE));

/** Domain vocabulary (§I.7.2). @type {readonly string[]} */
export const DOMAINS = Object.freeze([
  'auth', 'policy', 'memory', 'event', 'infra', 'platform', 'iaops',
  'machinenativeops', 'toolkit', 'contracts', 'signerd', 'controller',
  'rolloutd', 'db-schemas', 'autotask', 'compliance', 'prediction', 'qa',
  'rollback', 'scheduler', 'alertd',
]);

/** Function vocabulary (§I.7.3). @type {readonly string[]} */
export const FUNCTIONS = Object.freeze([
  'service', 'agent', 'sdk', 'cli', 'web', 'api', 'worker', 'manager', 'hub',
  'bus', 'engine', 'scanner', 'reporter', 'predictor', 'action', 'plugin',
  'controller', 'repository',
]);

/**
 * Governance era mapping by layer-group (§I.4.1). Maps the two leading digits
 * of a governance code to its era. @type {ReadonlyArray<[number, number, string]>}
 */
export const ERA_RANGES = Object.freeze([
  [0, 9, 'meta-governance'],
  [10, 49, 'era-one'],
  [50, 89, 'era-two'],
  [90, 99, 'cross-era-governance'],
]);

/**
 * Tokens forbidden anywhere in a repository name (§I.6.3).
 * @type {readonly string[]}
 */
export const FORBIDDEN_REPO_TOKENS = Object.freeze([
  'dev', 'prod', 'staging', 'v1', 'v2', 'latest',
]);
