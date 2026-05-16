/**
 * @mycodexvantaos/service-resource-registry
 * Resource Registry Runtime — loads resource kinds from contracts
 * and exposes them via list/get operations.
 *
 * Data source: contracts/resource-kinds/ (via contracts-sdk)
 */

import { loadResourceKinds, type ResourceKindContract } from '@mycodexvantaos/contracts-sdk';

// ─── Response Types ───────────────────────────────────────────────────────────

export interface ResourceKindListItem {
  name: string;
  kind: string;
  apiVersion: string;
  description?: string;
}

export interface ResourceKindDetail extends ResourceKindListItem {
  lifecycle?: string[];
  permissions?: Array<{ action: string; roles: string[] }>;
  audit_events?: string[];
  metadata_schema?: Record<string, unknown>;
  spec_schema?: Record<string, unknown>;
  status_schema?: Record<string, unknown>;
}

export interface ResourceKindListResponse {
  resourceKinds: ResourceKindListItem[];
  total: number;
}

export interface ResourceKindDetailResponse {
  resourceKind: ResourceKindDetail;
}

// ─── Internal State ───────────────────────────────────────────────────────────

let cachedResourceKinds: ResourceKindContract[] | null = null;

function getResourceKinds(): ResourceKindContract[] {
  if (!cachedResourceKinds) {
    cachedResourceKinds = loadResourceKinds();
  }
  return cachedResourceKinds;
}

/**
 * Clear the internal cache — useful for testing or hot-reload
 */
export function clearCache(): void {
  cachedResourceKinds = null;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * List all resource kinds in the registry
 */
export function listResourceKinds(): ResourceKindListResponse {
  const kinds = getResourceKinds();

  const items: ResourceKindListItem[] = kinds.map((rk) => ({
    name: rk.metadata.name,
    kind: rk.kind,
    apiVersion: rk.apiVersion,
    description: rk.metadata.description,
  }));

  return {
    resourceKinds: items,
    total: items.length,
  };
}

/**
 * Get a single resource kind by name (the `kind` field, e.g., "audit-event")
 *
 * @param kind - The resource kind identifier (e.g., "audit-event", "memory-item")
 * @returns Resource kind detail, or null if not found
 */
export function getResourceKind(kind: string): ResourceKindDetail | null {
  const kinds = getResourceKinds();
  const rk = kinds.find((k) => k.kind === kind || k.metadata.name === kind);

  if (!rk) {
    return null;
  }

  return {
    name: rk.metadata.name,
    kind: rk.kind,
    apiVersion: rk.apiVersion,
    description: rk.metadata.description,
    lifecycle: rk.lifecycle,
    permissions: rk.permissions,
    audit_events: rk.audit_events,
    metadata_schema: rk.metadata_schema,
    spec_schema: rk.spec_schema,
    status_schema: rk.status_schema,
  };
}
