/**
 * ci/utils/service-id-parser.ts
 *
 * Utility to parse and validate service-id segments.
 * Based on naming-spec-v1.md Section 5.1, Section 5.2, Section 6.1–Section 6.4
 */

import { validate, derivePackageShortId, derivePackageName } from "./regex-table.js";

export interface ServiceIdParts {
  /** The full service-id (e.g. "mycodexvantaos-ai-embedding") */
  full: string;
  /** The domain segment (e.g. "ai") */
  domain: string;
  /** The capability segment(s) joined (e.g. "embedding" or "vector-store") */
  capability: string;
  /** Derived package short id (e.g. "ai-embedding") */
  packageShortId: string;
  /** Derived package name (e.g. "@mycodexvantaos/ai-embedding") */
  packageName: string;
  /** Derived service path (e.g. "services/mycodexvantaos-ai-embedding/") */
  servicePath: string;
  /** Derived module path (e.g. "modules/mycodexvantaos-ai-embedding/") */
  modulePath: string;
  /** Derived manifest path */
  manifestPath: string;
  /** Derived k8s logical name (equals full service-id) */
  k8sLogicalName: string;
}

/**
 * Parse a service-id into its constituent parts and derive all related identifiers.
 * Throws if the service-id is not valid.
 */
export function parseServiceId(serviceId: string): ServiceIdParts {
  if (!validate("service-id", serviceId)) {
    throw new Error(
      `Invalid service-id: "${serviceId}". ` +
        `Must match ^mycodexvantaos-[a-z0-9]+(?:-[a-z0-9]+)+$ (Section 5.1)`
    );
  }

  // Strip prefix to get "domain-capability[-extra]"
  const withoutPrefix = serviceId.replace(/^mycodexvantaos-/, "");
  const parts = withoutPrefix.split("-");
  const domain = parts[0];
  const capability = parts.slice(1).join("-");

  return {
    full: serviceId,
    domain,
    capability,
    packageShortId: derivePackageShortId(serviceId),
    packageName: derivePackageName(serviceId),
    servicePath: `services/${serviceId}/`,
    modulePath: `modules/${serviceId}/`,
    manifestPath: `modules/${serviceId}/module-manifest.yaml`,
    k8sLogicalName: serviceId,
  };
}

/**
 * Verify that all derived identifiers of a service-id are consistent.
 * Returns a list of violations (empty = all good).
 */
export function verifyDerivationConsistency(
  serviceId: string,
  actual: {
    packageName?: string;
    manifestName?: string;
    k8sName?: string;
    moduleFolderName?: string;
    serviceFolderName?: string;
  }
): string[] {
  const violations: string[] = [];

  let parsed: ServiceIdParts;
  try {
    parsed = parseServiceId(serviceId);
  } catch (e) {
    return [`Invalid service-id: ${serviceId}`];
  }

  if (actual.packageName && actual.packageName !== parsed.packageName) {
    violations.push(
      `package name mismatch: expected "${parsed.packageName}", got "${actual.packageName}" (Section 7.1, Section 6.4)`
    );
  }
  if (actual.manifestName && actual.manifestName !== serviceId) {
    violations.push(
      `manifest metadata.name mismatch: expected "${serviceId}", got "${actual.manifestName}" (Section 6.3, Section 6.4)`
    );
  }
  if (actual.k8sName && actual.k8sName !== serviceId) {
    violations.push(
      `k8s logical name mismatch: expected "${serviceId}", got "${actual.k8sName}" (Section 5.4, Section 6.4)`
    );
  }
  if (actual.moduleFolderName && actual.moduleFolderName !== serviceId) {
    violations.push(
      `module folder name mismatch: expected "${serviceId}", got "${actual.moduleFolderName}" (Section 6.2, Section 6.4)`
    );
  }
  if (actual.serviceFolderName && actual.serviceFolderName !== serviceId) {
    violations.push(
      `service folder name mismatch: expected "${serviceId}", got "${actual.serviceFolderName}" (Section 6.1, Section 6.4)`
    );
  }

  return violations;
}
