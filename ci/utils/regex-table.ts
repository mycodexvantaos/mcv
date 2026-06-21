/**
 * ci/utils/regex-table.ts
 *
 * Single source of truth for all naming validation regexes.
 * Based on naming-spec-v1.md Section 13.
 *
 * This file is the authoritative input for all CI validators.
 * Must remain in sync with:
 *   - governance/naming-policy.schema.json
 *   - schemas/naming-policy.schema.json
 */

export type EnforcementLevel = 'hard' | 'soft';

export interface NamingRule {
  /** Rule identifier matching the naming-policy.schema.json key */
  id: string;
  /** Human-readable description */
  description: string;
  /** The validation regex */
  pattern: RegExp;
  /**
   * For most rules: pattern must MATCH for the name to be VALID.
   * For forbidden-legacy-prefix: pattern must NOT match for name to be VALID.
   */
  matchMeansValid: boolean;
  /** CI enforcement level. Hard = block merge. Soft = warn only. */
  enforcement: EnforcementLevel;
  /** Reference to naming-spec-v1.md section */
  specRef: string;
}

/** Section 13 — Complete naming rule table */
export const NAMING_RULES: Record<string, NamingRule> = {
  'service-id': {
    id: 'service-id',
    description:
      'Service identifier. Must start with mycodexvantaos- followed by at least one domain and one capability segment.',
    pattern: /^mycodexvantaos-[a-z0-9]+(?:-[a-z0-9]+)+$/,
    matchMeansValid: true,
    enforcement: 'hard',
    specRef: 'Section 5.1',
  },

  'package-short-id': {
    id: 'package-short-id',
    description:
      'Package short id. Derived from service-id by stripping the mycodexvantaos- prefix.',
    pattern: /^[a-z0-9]+(?:-[a-z0-9]+)+$/,
    matchMeansValid: true,
    enforcement: 'hard',
    specRef: 'Section 5.2',
  },

  'package-name': {
    id: 'package-name',
    description: 'npm/pnpm scoped package name under the @mycodexvantaos scope.',
    pattern: /^@mycodexvantaos\/[a-z0-9]+(?:-[a-z0-9]+)+$/,
    matchMeansValid: true,
    enforcement: 'hard',
    specRef: 'Section 7.1',
  },

  'capability-id': {
    id: 'capability-id',
    description:
      'Canonical capability identifier. Must be a member of the governance-defined canonical set. Vendor names forbidden.',
    pattern:
      /^(database|storage|auth|queue|state-store|secrets|repo|deploy|validation|security|observability|notification|scheduler|vector-store|embedding|llm|graph|cache|search|ai-ethics|blockchain|event-stream)$/,
    matchMeansValid: true,
    enforcement: 'hard',
    specRef: 'Section 5.5',
  },

  'provider-instance': {
    id: 'provider-instance',
    description:
      'Provider instance: <canonical-capability-id>-<provider-name>. Capability segment MUST come first.',
    pattern:
      /^(database|storage|auth|queue|state-store|secrets|repo|deploy|validation|security|observability|notification|scheduler|vector-store|embedding|llm|graph|cache|search|ai-ethics|blockchain|event-stream)-[a-z0-9-]+$/,
    matchMeansValid: true,
    enforcement: 'hard',
    specRef: 'Section 8.1',
  },

  'env-var': {
    id: 'env-var',
    description:
      'Environment variable. Must use MYCODEXVANTAOS_ prefix with uppercase and underscores.',
    pattern: /^MYCODEXVANTAOS_[A-Z0-9_]+$/,
    matchMeansValid: true,
    enforcement: 'hard',
    specRef: 'Section 7.2',
  },

  urn: {
    id: 'urn',
    description:
      'RFC 8141 compatible URN. No version in identifier segment. Type and subtype in kebab-case.',
    pattern: /^urn:mycodexvantaos:[a-z-]+:[a-z-]+:[a-z0-9-]+$/,
    matchMeansValid: true,
    enforcement: 'hard',
    specRef: 'Section 7.5',
  },

  'vector-collection': {
    id: 'vector-collection',
    description: 'Vector collection id: <service-id>--<purpose>--<embedding-model-alias>',
    pattern: /^mycodexvantaos-[a-z0-9]+(?:-[a-z0-9]+)+--[a-z0-9-]+--[a-z0-9-]+$/,
    matchMeansValid: true,
    enforcement: 'soft',
    specRef: 'Section 9.2',
  },

  'embedding-model-alias': {
    id: 'embedding-model-alias',
    description: 'Embedding model alias: <provider>--<model-name>--<dimension>d',
    pattern: /^[a-z0-9-]+--[a-z0-9-]+--[0-9]+d$/,
    matchMeansValid: true,
    enforcement: 'soft',
    specRef: 'Section 9.3',
  },

  'retrieval-pipeline-id': {
    id: 'retrieval-pipeline-id',
    description: 'Retrieval pipeline id: retrieval--<strategy>--<store-type>',
    pattern: /^retrieval--[a-z0-9-]+--[a-z0-9-]+$/,
    matchMeansValid: true,
    enforcement: 'soft',
    specRef: 'Section 9.4',
  },

  'search-index-id': {
    id: 'search-index-id',
    description: 'Search index id: idx--<service-id>--<field>--<analyzer>',
    pattern: /^idx--mycodexvantaos-[a-z0-9]+(?:-[a-z0-9]+)+--[a-z0-9-]+--[a-z0-9-]+$/,
    matchMeansValid: true,
    enforcement: 'soft',
    specRef: 'Section 9.5',
  },

  'graph-node-id': {
    id: 'graph-node-id',
    description: 'Graph node id: <service-id>--<entity-type>--<natural-key-normalized>',
    pattern: /^mycodexvantaos-[a-z0-9]+(?:-[a-z0-9]+)+--[a-z0-9-]+--[a-z0-9-]+$/,
    matchMeansValid: true,
    enforcement: 'soft',
    specRef: 'Section 9.6',
  },

  'graph-db-index-id': {
    id: 'graph-db-index-id',
    description: 'Graph DB index id: graph-idx--<service-id>--<label>--<property>',
    pattern: /^graph-idx--mycodexvantaos-[a-z0-9]+(?:-[a-z0-9]+)+--[a-z0-9-]+--[a-z0-9-]+$/,
    matchMeansValid: true,
    enforcement: 'soft',
    specRef: 'Section 10.3',
  },

  'timestamped-id': {
    id: 'timestamped-id',
    description: 'Auto-generated timestamped id: <prefix>--<YYYYMMDD>--<random6>',
    pattern: /^[a-z0-9-]+--[0-9]{8}--[a-z0-9]{6}$/,
    matchMeansValid: true,
    enforcement: 'soft',
    specRef: 'Section 9.8',
  },

  'content-addressed-id': {
    id: 'content-addressed-id',
    description: 'Content-addressed id: <prefix>--sha256-<first12 hex chars>',
    pattern: /^[a-z0-9-]+--sha256-[a-f0-9]{12}$/,
    matchMeansValid: true,
    enforcement: 'soft',
    specRef: 'Section 9.9',
  },

  'uuid-based-id': {
    id: 'uuid-based-id',
    description: 'UUID-based id: <prefix>--<uuid-without-dashes> (32 hex chars)',
    pattern: /^[a-z0-9-]+--[a-f0-9]{32}$/,
    matchMeansValid: true,
    enforcement: 'soft',
    specRef: 'Section 9.10',
  },

  'forbidden-legacy-prefix': {
    id: 'forbidden-legacy-prefix',
    description:
      'Forbidden legacy organization prefixes: mycodexvanta-os, codexvanta, codexvanta-os. ' +
      'Presence of this pattern means the name is INVALID.',
    pattern: /^(mycodexvanta-os|codexvanta|codexvanta-os)/,
    matchMeansValid: false, // match = VIOLATION
    enforcement: 'hard',
    specRef: 'Section 4',
  },
};

/** Convenience: get all hard enforcement rules */
export const HARD_RULES = Object.values(NAMING_RULES).filter((r) => r.enforcement === 'hard');

/** Convenience: get all soft enforcement rules */
export const SOFT_RULES = Object.values(NAMING_RULES).filter((r) => r.enforcement === 'soft');

/**
 * Validate a single value against a named rule.
 * Returns true if the value passes the rule.
 */
export function validate(ruleId: string, value: string): boolean {
  const rule = NAMING_RULES[ruleId];
  if (!rule) throw new Error(`Unknown rule: ${ruleId}`);
  const matched = rule.pattern.test(value);
  return rule.matchMeansValid ? matched : !matched;
}

/** Section 13 — Canonical capability values as a typed array */
export const CANONICAL_CAPABILITIES = [
  'database',
  'storage',
  'auth',
  'queue',
  'state-store',
  'secrets',
  'repo',
  'deploy',
  'validation',
  'security',
  'observability',
  'notification',
  'scheduler',
  'vector-store',
  'embedding',
  'llm',
  'graph',
  'cache',
  'search',
  'ai-ethics',
  'blockchain',
  'event-stream',
] as const;

export type CapabilityId = (typeof CANONICAL_CAPABILITIES)[number];

/** Section 3.6 — Check if a canonical identifier contains a version number pattern */
export function containsVersionPattern(name: string): boolean {
  return /(?:^|-)v\d+(?:\.\d+)*(?:-[a-z0-9]+)*(?:$|-)/.test(name);
}

/** Section 3.7 — Check if a canonical identifier contains an environment marker */
export function containsEnvironmentMarker(name: string): boolean {
  return /(?:^|-)(dev|staging|prod)(?:-|$)/.test(name);
}

/** Section 5.2 — Derive package short id from service id */
export function derivePackageShortId(serviceId: string): string {
  return serviceId.replace(/^mycodexvantaos-/, '');
}

/** Section 7.1 — Derive package name from service id */
export function derivePackageName(serviceId: string): string {
  return `@mycodexvantaos/${derivePackageShortId(serviceId)}`;
}
