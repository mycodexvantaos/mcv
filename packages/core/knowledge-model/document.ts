/**
 * MyCodexVantaOS — Document Model
 * Knowledge as operational substrate.
 */

import type { ResourceCondition } from '../shared';

export type DocumentFormat = 'pdf' | 'txt' | 'md' | 'html' | 'json' | 'csv' | 'docx';
export type DocumentPhase =
  | 'uploaded'
  | 'ingesting'
  | 'ready'
  | 'failed'
  | 'stale'
  | 'archived'
  | 'deleted';

export interface DocumentSpec {
  title: string;
  format: DocumentFormat;
  collectionId: string;
  sourceUri: string | null;
  language: string;
}

export interface DocumentStatus {
  phase: DocumentPhase;
  conditions: ResourceCondition[];
  chunkCount: number;
  totalTokens: number;
  fileSizeBytes: number;
  verificationStatus: 'passed' | 'failed' | 'pending' | 'skipped';
}
