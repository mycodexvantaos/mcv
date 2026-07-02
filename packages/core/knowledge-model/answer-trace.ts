/**
 * MyCodeXvantaOS — Answer Trace Model
 * Closed-loop trace from question → retrieval → model → answer.
 *
 * Every AI-generated answer must be traceable to its sources.
 * AnswerTrace binds a model response to the retrieval receipts that
 * grounded it, enabling downstream verification and audit.
 */

import type { ResourceCondition } from '../shared';
import type { EvidenceLevel, AnswerTracePhase } from './knowledge-index';

export interface AnswerTraceSpec {
  /** The chat session this trace belongs to */
  sessionId: string;
  /** The specific message ID this trace covers */
  messageId: string;
  /** IDs of retrieval receipts that grounded this answer */
  retrievalReceiptIds: string[];
  /** The model endpoint that generated the answer */
  modelEndpointId: string;
  /** Token counts for billing and audit */
  promptTokens: number;
  completionTokens: number;
  /** Overall evidence level of the answer */
  evidenceLevel: EvidenceLevel;
  /** Number of source documents referenced */
  sourceCount: number;
}

export interface AnswerTraceStatus {
  phase: AnswerTracePhase;
  conditions: ResourceCondition[];
  verifiedAt: string | null;
  integrityHash: string;
}
