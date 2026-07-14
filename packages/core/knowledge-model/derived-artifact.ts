/**
 * MyCodexVantaOS — Derived Artifact Model
 * Artifacts produced from knowledge: summaries, translations, extractions.
 *
 * Derived artifacts track the transformation chain:
 *   source document → processing → derived artifact
 * This enables full provenance tracking for any generated content.
 */

import type { ResourceCondition } from '../shared';

export type DerivedArtifactType =
  | 'summary'
  | 'translation'
  | 'extraction'
  | 'synthesis'
  | 'embedding-index';

export interface DerivedArtifactSpec {
  /** The document(s) this artifact was derived from */
  sourceDocumentIds: string[];
  /** What kind of derivation was performed */
  artifactType: DerivedArtifactType;
  /** The model or algorithm used for derivation */
  derivedBy: string;
  /** Parameters used in derivation */
  derivationParams: Record<string, unknown>;
  /** The collection this artifact belongs to */
  collectionId: string;
  /** Output content (may be a reference to stored content) */
  outputUri: string | null;
}

export interface DerivedArtifactStatus {
  phase: DerivedArtifactPhase;
  conditions: ResourceCondition[];
  qualityScore: number | null;
  verifiedAt: string | null;
  totalTokensUsed: number;
}

export type DerivedArtifactPhase =
  | 'generating'
  | 'completed'
  | 'failed'
  | 'verified'
  | 'deprecated';
