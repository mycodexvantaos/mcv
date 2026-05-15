/**
 * @mycodexvantaos/contracts-sdk
 * Contracts SDK - load, validate, and expose typed contract readers for YAML/JSON contracts
 *
 * This is the single source of truth entry point for loading all platform contracts.
 * All runtime services must use this SDK to access contract data — no hardcoded arrays.
 *
 * Supports two contract formats:
 * 1. Standard: apiVersion/kind/metadata/spec (Kubernetes-like)
 * 2. Legacy: id/category/description (flat) — auto-normalized on load
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, join, extname } from 'node:path';
import { parse as yamlParse } from 'yaml';

// ─── Contract Type Definitions ────────────────────────────────────────────────

/** A single service definition from contracts/service-definitions/ */
export interface ServiceDefinitionContract {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    urn?: string;
    version?: string;
    category?: string;
    display_name?: string;
    description?: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
    namespace?: string;
  };
  spec: {
    resource_type?: string;
    runtime?: Record<string, unknown>;
    capabilities?: Array<{ id: string; method: string; description: string; input?: Record<string, unknown>; output?: Record<string, unknown> }>;
    limits?: Record<string, unknown>;
    events?: { emitted?: string[]; subscribed?: string[] };
    audit?: Record<string, unknown>;
    dependencies?: { hard?: string[]; soft?: string[] } | string[];
    ports?: Array<{ interface: string; methods?: string[] }>;
    [key: string]: unknown;
  };
}

/** A single resource kind from contracts/resource-kinds/ */
export interface ResourceKindContract {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    description?: string;
    version?: string;
  };
  spec?: Record<string, unknown>;
  /** Original fields from resource-kind contracts */
  metadata_schema?: Record<string, unknown>;
  spec_schema?: Record<string, unknown>;
  status_schema?: Record<string, unknown>;
  lifecycle?: string[];
  permissions?: Array<{ action: string; roles: string[] }>;
  audit_events?: string[];
}

/** A policy definition from contracts/policies/ */
export interface PolicyDefinitionContract {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    description?: string;
    version?: string;
  };
  spec: Record<string, unknown>;
}

/** An event definition from contracts/events/ */
export interface EventDefinitionContract {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    description?: string;
  };
  spec: Record<string, unknown>;
}

// ─── Internal Helpers ─────────────────────────────────────────────────────────

/**
 * Resolve the contracts root directory.
 * Walks up from the given directory to find a directory containing a `contracts/` folder.
 */
function resolveContractsRoot(startDir?: string): string {
  let dir = startDir ?? resolve(process.cwd());
  for (let i = 0; i < 10; i++) {
    if (existsSync(join(dir, 'contracts'))) {
      return dir;
    }
    const parent = resolve(dir, '..');
    if (parent === dir) break;
    dir = parent;
  }
  // Fallback to CWD
  return process.cwd();
}

/**
 * Load and parse a single YAML or JSON file
 */
function loadYamlOrJson(filePath: string): Record<string, unknown> {
  const content = readFileSync(filePath, 'utf-8');
  const ext = extname(filePath);

  if (ext === '.json') {
    return JSON.parse(content) as Record<string, unknown>;
  }

  // .yaml or .yml
  return yamlParse(content) as Record<string, unknown>;
}

/**
 * Load all YAML/JSON files from a directory, returning parsed objects
 */
function loadAllFromDir(dirPath: string): Record<string, unknown>[] {
  if (!existsSync(dirPath)) {
    return [];
  }

  const files = readdirSync(dirPath)
    .filter((f) => extname(f) === '.yaml' || extname(f) === '.yml' || extname(f) === '.json')
    .sort();

  return files.map((f) => loadYamlOrJson(join(dirPath, f)));
}

/**
 * Normalize a service definition contract.
 * Handles both standard (apiVersion/kind/metadata/spec) and legacy flat (id/category) formats.
 */
function normalizeServiceDefinition(raw: Record<string, unknown>): ServiceDefinitionContract {
  // Already in standard format
  if (raw.apiVersion && raw.kind && raw.metadata) {
    return raw as unknown as ServiceDefinitionContract;
  }

  // Normalize flat format: id → metadata.name, category → metadata.category
  const name = (raw.id as string) ?? (raw.metadata as Record<string, unknown>)?.name as string ?? 'unknown';
  const metadata: ServiceDefinitionContract['metadata'] = {
    name,
    category: raw.category as string | undefined,
    display_name: raw.display_name as string | undefined,
    description: raw.description as string | undefined,
  };

  const spec: ServiceDefinitionContract['spec'] = {
    resource_type: raw.resource_type as string | undefined,
    runtime: raw.runtime as Record<string, unknown> | undefined,
    events: raw.events
      ? { emitted: Array.isArray(raw.events) ? raw.events as string[] : [], subscribed: [] }
      : undefined,
    audit: raw.audit as Record<string, unknown> | undefined,
    ...Object.fromEntries(
      Object.entries(raw).filter(([k]) =>
        !['id', 'category', 'display_name', 'description', 'resource_types', 'permissions', 'events', 'usage_metrics', 'runtime', 'audit'].includes(k)
      )
    ),
  };

  return {
    apiVersion: (raw.apiVersion as string) ?? 'platform.mycodexvantaos/v1',
    kind: (raw.kind as string) ?? 'ServiceDefinition',
    metadata,
    spec,
  };
}

/**
 * Normalize a resource kind contract.
 * Resource kinds use `kind` as the name identifier and `metadata_schema` instead of `metadata`.
 */
function normalizeResourceKind(raw: Record<string, unknown>): ResourceKindContract {
  const name = (raw.kind as string) ?? (raw.metadata as Record<string, unknown>)?.name as string ?? 'unknown';

  return {
    apiVersion: (raw.apiVersion as string) ?? 'mycodexvantaos.io/v1',
    kind: (raw.kind as string) ?? 'ResourceKind',
    metadata: {
      name,
      description: (raw.description as string) ?? (raw.metadata as Record<string, unknown>)?.description as string,
    },
    metadata_schema: raw.metadata_schema as Record<string, unknown> | undefined,
    spec_schema: raw.spec_schema as Record<string, unknown> | undefined,
    status_schema: raw.status_schema as Record<string, unknown> | undefined,
    lifecycle: raw.lifecycle as string[] | undefined,
    permissions: raw.permissions as Array<{ action: string; roles: string[] }> | undefined,
    audit_events: raw.audit_events as string[] | undefined,
    spec: raw.spec as Record<string, unknown> | undefined,
  };
}

/**
 * Normalize a policy definition contract.
 * Policies may use flat format with `id` instead of `metadata.name`.
 */
function normalizePolicyDefinition(raw: Record<string, unknown>): PolicyDefinitionContract {
  // Already in standard format
  if (raw.apiVersion && raw.kind && raw.metadata) {
    return raw as unknown as PolicyDefinitionContract;
  }

  const name = (raw.id as string) ?? (raw.metadata as Record<string, unknown>)?.name as string ?? 'unknown';

  return {
    apiVersion: (raw.apiVersion as string) ?? 'platform.mycodexvantaos/v1',
    kind: (raw.kind as string) ?? 'PolicyDefinition',
    metadata: {
      name,
      description: raw.description as string | undefined,
    },
    spec: {
      rules: raw.rules,
      ...Object.fromEntries(
        Object.entries(raw).filter(([k]) =>
          !['id', 'description', 'rules', 'apiVersion', 'kind', 'metadata'].includes(k)
        )
      ),
    },
  };
}

/**
 * Normalize an event definition contract.
 * Events may use flat format with `category` instead of `apiVersion/kind/metadata`.
 */
function normalizeEventDefinition(raw: Record<string, unknown>): EventDefinitionContract {
  // Already in standard format
  if (raw.apiVersion && raw.kind && raw.metadata) {
    return raw as unknown as EventDefinitionContract;
  }

  const name = (raw.category as string) ?? (raw.id as string) ?? (raw.metadata as Record<string, unknown>)?.name as string ?? 'unknown';

  return {
    apiVersion: (raw.apiVersion as string) ?? 'platform.mycodexvantaos/v1',
    kind: (raw.kind as string) ?? 'EventDefinition',
    metadata: {
      name,
      description: raw.description as string | undefined,
    },
    spec: {
      events: raw.events,
      ...Object.fromEntries(
        Object.entries(raw).filter(([k]) =>
          !['category', 'description', 'events', 'apiVersion', 'kind', 'metadata'].includes(k)
        )
      ),
    },
  };
}

/**
 * Simple contract validator for basic structural requirements.
 */
function validateBasicContract(
  data: Record<string, unknown>,
  requiredFields: string[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const field of requiredFields) {
    if (!(field in data)) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Load all service definitions from contracts/service-definitions/
 *
 * @param contractsDir - Optional override for the contracts directory path
 * @returns Array of typed service definition contracts
 */
export function loadServiceDefinitions(contractsDir?: string): ServiceDefinitionContract[] {
  const root = resolveContractsRoot(contractsDir);
  const dir = join(root, 'contracts', 'service-definitions');
  const raw = loadAllFromDir(dir);

  return raw.map((item) => normalizeServiceDefinition(item));
}

/**
 * Load all resource kinds from contracts/resource-kinds/
 *
 * @param contractsDir - Optional override for the contracts directory path
 * @returns Array of typed resource kind contracts
 */
export function loadResourceKinds(contractsDir?: string): ResourceKindContract[] {
  const root = resolveContractsRoot(contractsDir);
  const dir = join(root, 'contracts', 'resource-kinds');
  const raw = loadAllFromDir(dir);

  return raw.map((item) => normalizeResourceKind(item));
}

/**
 * Load all policy definitions from contracts/policies/
 *
 * @param contractsDir - Optional override for the contracts directory path
 * @returns Array of typed policy definition contracts
 */
export function loadPolicyDefinitions(contractsDir?: string): PolicyDefinitionContract[] {
  const root = resolveContractsRoot(contractsDir);
  const dir = join(root, 'contracts', 'policies');
  const raw = loadAllFromDir(dir);

  return raw.map((item) => normalizePolicyDefinition(item));
}

/**
 * Load all event definitions from contracts/events/
 *
 * @param contractsDir - Optional override for the contracts directory path
 * @returns Array of typed event definition contracts
 */
export function loadEventDefinitions(contractsDir?: string): EventDefinitionContract[] {
  const root = resolveContractsRoot(contractsDir);
  const dir = join(root, 'contracts', 'events');
  const raw = loadAllFromDir(dir);

  return raw.map((item) => normalizeEventDefinition(item));
}

/**
 * Load the service catalog from contracts/service-definitions/service-catalog.yaml
 *
 * @param contractsDir - Optional override for the contracts directory path
 * @returns The service catalog contract, or null if not found
 */
export function loadServiceCatalog(contractsDir?: string): ServiceDefinitionContract | null {
  const root = resolveContractsRoot(contractsDir);
  const catalogPath = join(root, 'contracts', 'service-definitions', 'service-catalog.yaml');

  if (!existsSync(catalogPath)) {
    return null;
  }

  const raw = loadYamlOrJson(catalogPath);
  return normalizeServiceDefinition(raw);
}

/**
 * Load all JSON schemas from contracts/schemas/
 *
 * @param contractsDir - Optional override for the contracts directory path
 * @returns Map of schema name to parsed JSON schema object
 */
export function loadSchemas(contractsDir?: string): Map<string, Record<string, unknown>> {
  const root = resolveContractsRoot(contractsDir);
  const dir = join(root, 'contracts', 'schemas');
  const schemas = new Map<string, Record<string, unknown>>();

  if (!existsSync(dir)) {
    return schemas;
  }

  const files = readdirSync(dir)
    .filter((f) => extname(f) === '.json')
    .sort();

  for (const f of files) {
    const schemaName = f.replace('.schema.json', '');
    const raw = loadYamlOrJson(join(dir, f));
    schemas.set(schemaName, raw);
  }

  return schemas;
}

/**
 * Validate a contract object against basic structural requirements
 *
 * @param data - The contract data to validate
 * @param requiredFields - Required top-level fields
 * @returns Validation result with errors if any
 */
export function validateContract(
  data: Record<string, unknown>,
  requiredFields: string[] = ['apiVersion', 'kind']
): { valid: boolean; errors: string[] } {
  return validateBasicContract(data, requiredFields);
}

/**
 * Validate all loaded contracts have required fields
 *
 * @param contractsDir - Optional override for the contracts directory path
 * @returns Validation summary
 */
export function validateAllContracts(contractsDir?: string): {
  services: { valid: boolean; errors: string[] };
  resourceKinds: { valid: boolean; errors: string[] };
  policies: { valid: boolean; errors: string[] };
  events: { valid: boolean; errors: string[] };
} {
  const services = loadServiceDefinitions(contractsDir);
  const resourceKinds = loadResourceKinds(contractsDir);
  const policies = loadPolicyDefinitions(contractsDir);
  const events = loadEventDefinitions(contractsDir);

  const serviceErrors: string[] = [];
  for (const s of services) {
    const result = validateBasicContract(s as unknown as Record<string, unknown>, ['apiVersion', 'kind']);
    if (!result.valid) {
      serviceErrors.push(`${s.metadata?.name ?? 'unknown'}: ${result.errors.join(', ')}`);
    }
  }

  const resourceKindErrors: string[] = [];
  for (const r of resourceKinds) {
    const result = validateBasicContract(r as unknown as Record<string, unknown>, ['apiVersion', 'kind']);
    if (!result.valid) {
      resourceKindErrors.push(`${r.metadata?.name ?? 'unknown'}: ${result.errors.join(', ')}`);
    }
  }

  const policyErrors: string[] = [];
  for (const p of policies) {
    const result = validateBasicContract(p as unknown as Record<string, unknown>, ['apiVersion', 'kind']);
    if (!result.valid) {
      policyErrors.push(`${p.metadata?.name ?? 'unknown'}: ${result.errors.join(', ')}`);
    }
  }

  const eventErrors: string[] = [];
  for (const e of events) {
    const result = validateBasicContract(e as unknown as Record<string, unknown>, ['apiVersion', 'kind']);
    if (!result.valid) {
      eventErrors.push(`${e.metadata?.name ?? 'unknown'}: ${result.errors.join(', ')}`);
    }
  }

  return {
    services: { valid: serviceErrors.length === 0, errors: serviceErrors },
    resourceKinds: { valid: resourceKindErrors.length === 0, errors: resourceKindErrors },
    policies: { valid: policyErrors.length === 0, errors: policyErrors },
    events: { valid: eventErrors.length === 0, errors: eventErrors },
  };
}
