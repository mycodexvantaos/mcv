/**
 * MyCodeXvantaOS — Resource Kind Model
 * Every entity in the platform is a resource with this structure.
 * Platform resource URI: res://{service}/{collection}/{id}
 */

import type { ResourceMetadata, ResourceCondition } from '../shared';

/** Universal resource envelope */
export interface Resource<TSpec = Record<string, unknown>, TStatus = Record<string, unknown>> {
  apiVersion: string;
  kind: string;
  metadata: ResourceMetadata;
  spec: TSpec;
  status?: TStatus;
}

/** Standard resource phases */
export type ResourcePhase = 'creating' | 'active' | 'updating' | 'degraded' | 'suspended' | 'deleting' | 'deleted';

/** Resource reference for cross-resource links */
export interface ResourceReference {
  kind: string;
  id: string;
  urn: string;
}

/** Core platform resource kinds */
export type PlatformResourceKind =
  | 'tenant'
  | 'subject'
  | 'workspace'
  | 'membership'
  | 'knowledge-collection'
  | 'document'
  | 'document-chunk'
  | 'knowledge-index'
  | 'retrieval-receipt'
  | 'answer-trace'
  | 'memory-item'
  | 'chat-session'
  | 'chat-message'
  | 'model-endpoint'
  | 'api-key'
  | 'audit-event'
  | 'usage-record'
  | 'knowledge-issue'
  | 'knowledge-repair'
  | 'knowledge-derived-artifact'
  | 'automation-job';

/** Resource URI format */
export function resourceUri(service: string, collection: string, id: string): string {
  return `res://${service}/${collection}/${id}`;
}
