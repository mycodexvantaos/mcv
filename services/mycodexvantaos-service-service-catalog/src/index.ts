/**
 * @mycodexvantaos/service-service-catalog
 * Service Catalog Runtime — loads service definitions from contracts
 * and exposes them via list/get operations.
 *
 * Data source: contracts/service-definitions/ (via contracts-sdk)
 */

import {
  loadServiceDefinitions,
  loadServiceCatalog,
  type ServiceDefinitionContract,
} from '@mycodexvantaos/contracts-sdk';

// ─── Response Types ───────────────────────────────────────────────────────────

export interface ServiceListItem {
  name: string;
  category: string | undefined;
  display_name: string | undefined;
  description: string | undefined;
  version: string | undefined;
  urn: string | undefined;
  apiVersion: string;
  kind: string;
}

export interface ServiceDetail extends ServiceListItem {
  spec: ServiceDefinitionContract['spec'];
}

export interface ServiceListResponse {
  services: ServiceListItem[];
  total: number;
}

export interface ServiceDetailResponse {
  service: ServiceDetail;
}

// ─── Internal State ───────────────────────────────────────────────────────────

let cachedServices: ServiceDefinitionContract[] | null = null;
let cachedCatalog: ServiceDefinitionContract | null | undefined = undefined;

/**
 * Get all service definitions (cached after first load)
 */
function getServiceDefinitions(): ServiceDefinitionContract[] {
  if (!cachedServices) {
    cachedServices = loadServiceDefinitions();
  }
  return cachedServices;
}

/**
 * Get the service catalog (cached after first load)
 */
function getServiceCatalog(): ServiceDefinitionContract | null {
  if (cachedCatalog === undefined) {
    cachedCatalog = loadServiceCatalog() ?? null;
  }
  return cachedCatalog;
}

/**
 * Clear the internal cache — useful for testing or hot-reload
 */
export function clearCache(): void {
  cachedServices = null;
  cachedCatalog = undefined;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * List all services in the catalog
 *
 * @returns A list of service summary items with total count
 */
export function listServices(): ServiceListResponse {
  const services = getServiceDefinitions();

  const items: ServiceListItem[] = services.map((s) => ({
    name: s.metadata.name,
    category: s.metadata.category,
    display_name: s.metadata.display_name,
    description: s.metadata.description,
    version: s.metadata.version,
    urn: s.metadata.urn,
    apiVersion: s.apiVersion,
    kind: s.kind,
  }));

  return {
    services: items,
    total: items.length,
  };
}

/**
 * Get a single service by name
 *
 * @param name - The service name (metadata.name)
 * @returns Service detail, or null if not found
 */
export function getService(name: string): ServiceDetail | null {
  const services = getServiceDefinitions();
  const svc = services.find((s) => s.metadata.name === name);

  if (!svc) {
    return null;
  }

  return {
    name: svc.metadata.name,
    category: svc.metadata.category,
    display_name: svc.metadata.display_name,
    description: svc.metadata.description,
    version: svc.metadata.version,
    urn: svc.metadata.urn,
    apiVersion: svc.apiVersion,
    kind: svc.kind,
    spec: svc.spec,
  };
}

/**
 * Get the service catalog metadata
 *
 * @returns The service catalog contract, or null if not found
 */
export function getCatalog(): ServiceDefinitionContract | null {
  return getServiceCatalog();
}
