/**
 * Type definitions for Semantic Core Client
 */

import { Logger } from 'pino';

/**
 * Decision context for semantic analysis
 */
export interface DecisionContext {
  hypothesis: string;
  evidence: Evidence[];
  parameters?: DecisionParameters;
  request_id?: string;
  metadata?: Record<string, any>;
}

/**
 * Evidence item
 */
export interface Evidence {
  source: EvidenceSource;
  content: string;
  confidence: number;
  timestamp: Date;
  tags?: string[];
}

export type EvidenceSource =
  | 'internal_primary'
  | 'internal_secondary'
  | 'external_peer_reviewed'
  | 'external_standard'
  | 'global_news'
  | 'global_forum';

/**
 * Decision parameters
 */
export interface DecisionParameters {
  evidence_sufficiency_threshold?: number;
  hypothesis_confidence_min?: number;
  risk_tolerance?: number;
  enable_feedback?: boolean;
}

/**
 * Decision result
 */
export interface Decision {
  verdict: 'ALLOW' | 'DENY' | 'ABSTAIN';
  confidence: number;
  reasoning: string;
  scores: {
    evidence_sufficiency: number;
    hypothesis_validation: number;
    action_priority: number;
  };
  vectorAnalysis: {
    hypothesis_vector: number[];
    evidence_clusters: EvidenceCluster[];
    semantic_distances: number[];
  };
  fallback_mode?: string;
  fallback_reason?: string;
  audit: {
    request_id: string;
    timestamp: Date;
    processing_time_ms: number;
  };
}

/**
 * Evidence cluster
 */
export interface EvidenceCluster {
  id: string;
  size: number;
  centroid: number[];
  semantic_coherence: number;
}

/**
 * Semantic Core Client Configuration
 */
export interface SemanticCoreClientConfig {
  baseUrl: string;
  timeout?: number;
  retries?: number;
  logger?: Logger;
}
