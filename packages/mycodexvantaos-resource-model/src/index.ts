/**
 * @mycodexvantaos/mycodexvantaos-resource-model
 * Resource model - resource kinds, metadata, spec, status, lifecycle, references
 */

// Re-export from core constitution
export * from '@mycodexvantaos/core/resource-model';

// Extended types for standalone package
export type ResourceKind = string;

export interface ResourceSpec {
  [key: string]: unknown;
}

export interface ResourceStatus {
  phase: string;
  conditions?: Record<string, unknown>;
  observedGeneration?: number;
}
