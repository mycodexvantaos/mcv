/**
 * MyCodeXvantaOS — Shared Metadata Types
 * Resource metadata, labels, annotations.
 */

export interface ResourceMetadata {
  id: string;
  urn: string;
  kind: string;
  workspaceId: string;
  labels: Record<string, string>;
  annotations: Record<string, string>;
  createdBy: string;
  version: string;
  resourceVersion: number;
  createdAt: string;
  updatedAt: string;
}

export interface ResourceCondition {
  type: string;
  status: "True" | "False" | "Unknown";
  reason: string;
  message: string;
  lastTransitionTime: string;
}

export interface OwnerReference {
  kind: string;
  id: string;
  name: string;
}
