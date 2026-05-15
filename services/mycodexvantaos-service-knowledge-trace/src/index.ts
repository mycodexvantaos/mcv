/**
 * @mycodexvantaos/service-knowledge-trace
 * Knowledge Trace Runtime — retrieval receipts and answer traces for RAG pipelines.
 *
 * MVP: In-memory storage with full trace lifecycle.
 * Production: Will use D1/SQLite for persistence.
 *
 * Rules:
 * - No retrieval receipt → cannot mark knowledge-assisted
 * - Every answer trace must reference a valid receipt
 * - Receipts are immutable once created
 * - Answer traces can be appended but not mutated
 */

import { createHash } from 'node:crypto';

// ─── Types ─────────────────────────────────────────────────────────────

export type EvidenceLevel = 'knowledge-assisted' | 'knowledge-verified' | 'knowledge-grounded';

export interface SearchResult {
  chunkId: string;
  content: string;
  score: number;
  collectionId?: string;
  documentId?: string;
  metadata?: Record<string, unknown>;
}

export interface RetrievalReceipt {
  receiptId: string;
  query: string;
  collectionIds: string[];
  results: SearchResult[];
  totalResults: number;
  topK: number;
  evidenceLevel: EvidenceLevel;
  createdAt: string;
  hash: string;
}

export interface Citation {
  chunkId: string;
  text: string;
  score?: number;
  documentId?: string;
}

export interface AnswerTrace {
  traceId: string;
  receiptId: string;
  query: string;
  answer: string;
  evidenceLevel: EvidenceLevel;
  citations: Citation[];
  modelId?: string;
  promptTokens?: number;
  completionTokens?: number;
  createdAt: string;
  hash: string;
}

// ─── Request/Response Types ────────────────────────────────────────────

export interface CreateSearchRequest {
  query: string;
  collectionIds?: string[];
  topK?: number;
  evidenceLevel?: EvidenceLevel;
}

export interface CreateSearchResponse {
  receipt: RetrievalReceipt;
}

export interface CreateAnswerTraceRequest {
  receiptId: string;
  answer: string;
  evidenceLevel?: EvidenceLevel;
  citations?: Citation[];
  modelId?: string;
  promptTokens?: number;
  completionTokens?: number;
}

export interface CreateAnswerTraceResponse {
  trace: AnswerTrace;
}

export interface QueryReceiptsRequest {
  collectionId?: string;
  fromTimestamp?: string;
  toTimestamp?: string;
  limit?: number;
  offset?: number;
}

export interface QueryReceiptsResponse {
  receipts: RetrievalReceipt[];
  total: number;
  limit: number;
  offset: number;
}

export interface QueryTracesRequest {
  receiptId?: string;
  evidenceLevel?: EvidenceLevel;
  fromTimestamp?: string;
  toTimestamp?: string;
  limit?: number;
  offset?: number;
}

export interface QueryTracesResponse {
  traces: AnswerTrace[];
  total: number;
  limit: number;
  offset: number;
}

// ─── Internal State ────────────────────────────────────────────────────

const retrievalReceipts = new Map<string, RetrievalReceipt>();
const answerTraces = new Map<string, AnswerTrace>();

// ─── Helpers ───────────────────────────────────────────────────────────

function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${random}`;
}

function computeReceiptHash(receipt: Omit<RetrievalReceipt, 'hash'>): string {
  const payload = JSON.stringify({
    receiptId: receipt.receiptId,
    query: receipt.query,
    totalResults: receipt.totalResults,
    results: receipt.results.map((r) => ({ chunkId: r.chunkId, score: r.score })),
    createdAt: receipt.createdAt,
  });
  return createHash('sha256').update(payload).digest('hex');
}

function computeTraceHash(trace: Omit<AnswerTrace, 'hash'>): string {
  const payload = JSON.stringify({
    traceId: trace.traceId,
    receiptId: trace.receiptId,
    answer: trace.answer,
    citations: trace.citations.map((c) => c.chunkId),
    createdAt: trace.createdAt,
  });
  return createHash('sha256').update(payload).digest('hex');
}

// ─── Public API ────────────────────────────────────────────────────────

/**
 * Create a retrieval receipt from a search request.
 *
 * In MVP, results are provided by the caller (from a search engine).
 * In production, this will integrate with the knowledge-search service.
 */
export function createSearchReceipt(req: CreateSearchRequest): CreateSearchResponse {
  const receiptId = generateId('rcpt');
  const now = new Date().toISOString();
  const topK = req.topK ?? 10;
  const evidenceLevel = req.evidenceLevel ?? 'knowledge-assisted';

  const receiptWithoutHash: Omit<RetrievalReceipt, 'hash'> = {
    receiptId,
    query: req.query,
    collectionIds: req.collectionIds ?? [],
    results: [],
    totalResults: 0,
    topK,
    evidenceLevel,
    createdAt: now,
  };

  const hash = computeReceiptHash(receiptWithoutHash);
  const receipt: RetrievalReceipt = { ...receiptWithoutHash, hash };

  retrievalReceipts.set(receiptId, receipt);

  return { receipt };
}

/**
 * Create a retrieval receipt with pre-computed results.
 * Used when the API server receives search results from a knowledge engine.
 */
export function createSearchReceiptWithResults(
  req: CreateSearchRequest,
  results: SearchResult[]
): CreateSearchResponse {
  const receiptId = generateId('rcpt');
  const now = new Date().toISOString();
  const topK = req.topK ?? 10;
  const evidenceLevel = req.evidenceLevel ?? 'knowledge-assisted';
  const trimmedResults = results.slice(0, topK);

  const receiptWithoutHash: Omit<RetrievalReceipt, 'hash'> = {
    receiptId,
    query: req.query,
    collectionIds: req.collectionIds ?? [],
    results: trimmedResults,
    totalResults: trimmedResults.length,
    topK,
    evidenceLevel,
    createdAt: now,
  };

  const hash = computeReceiptHash(receiptWithoutHash);
  const receipt: RetrievalReceipt = { ...receiptWithoutHash, hash };

  retrievalReceipts.set(receiptId, receipt);

  return { receipt };
}

/**
 * Get a retrieval receipt by ID
 */
export function getReceipt(receiptId: string): RetrievalReceipt | null {
  return retrievalReceipts.get(receiptId) ?? null;
}

/**
 * Query retrieval receipts with filters
 */
export function queryReceipts(req: QueryReceiptsRequest = {}): QueryReceiptsResponse {
  let filtered = Array.from(retrievalReceipts.values());

  if (req.collectionId) {
    filtered = filtered.filter((r) => r.collectionIds.includes(req.collectionId!));
  }
  if (req.fromTimestamp) {
    filtered = filtered.filter((r) => r.createdAt >= req.fromTimestamp!);
  }
  if (req.toTimestamp) {
    filtered = filtered.filter((r) => r.createdAt <= req.toTimestamp!);
  }

  // Sort by createdAt descending
  filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const total = filtered.length;
  const offset = req.offset ?? 0;
  const limit = req.limit ?? 50;
  const paged = filtered.slice(offset, offset + limit);

  return { receipts: paged, total, limit, offset };
}

/**
 * Create an answer trace linked to a retrieval receipt.
 *
 * Rule: No retrieval receipt → cannot create answer trace.
 * The receiptId MUST reference a valid receipt.
 */
export function createAnswerTrace(req: CreateAnswerTraceRequest): CreateAnswerTraceResponse {
  const receipt = retrievalReceipts.get(req.receiptId);
  if (!receipt) {
    throw new Error(`Retrieval receipt not found: ${req.receiptId}. Cannot create answer trace without a valid receipt.`);
  }

  const traceId = generateId('trace');
  const now = new Date().toISOString();
  const evidenceLevel = req.evidenceLevel ?? receipt.evidenceLevel;

  const traceWithoutHash: Omit<AnswerTrace, 'hash'> = {
    traceId,
    receiptId: req.receiptId,
    query: receipt.query,
    answer: req.answer,
    evidenceLevel,
    citations: req.citations ?? [],
    modelId: req.modelId,
    promptTokens: req.promptTokens,
    completionTokens: req.completionTokens,
    createdAt: now,
  };

  const hash = computeTraceHash(traceWithoutHash);
  const trace: AnswerTrace = { ...traceWithoutHash, hash };

  answerTraces.set(traceId, trace);

  return { trace };
}

/**
 * Get an answer trace by ID
 */
export function getTrace(traceId: string): AnswerTrace | null {
  return answerTraces.get(traceId) ?? null;
}

/**
 * Get all answer traces for a given receipt
 */
export function getTracesByReceipt(receiptId: string): AnswerTrace[] {
  return Array.from(answerTraces.values()).filter((t) => t.receiptId === receiptId);
}

/**
 * Query answer traces with filters
 */
export function queryTraces(req: QueryTracesRequest = {}): QueryTracesResponse {
  let filtered = Array.from(answerTraces.values());

  if (req.receiptId) {
    filtered = filtered.filter((t) => t.receiptId === req.receiptId!);
  }
  if (req.evidenceLevel) {
    filtered = filtered.filter((t) => t.evidenceLevel === req.evidenceLevel!);
  }
  if (req.fromTimestamp) {
    filtered = filtered.filter((t) => t.createdAt >= req.fromTimestamp!);
  }
  if (req.toTimestamp) {
    filtered = filtered.filter((t) => t.createdAt <= req.toTimestamp!);
  }

  // Sort by createdAt descending
  filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const total = filtered.length;
  const offset = req.offset ?? 0;
  const limit = req.limit ?? 50;
  const paged = filtered.slice(offset, offset + limit);

  return { traces: paged, total, limit, offset };
}

/**
 * Verify the integrity of a receipt (hash check)
 */
export function verifyReceipt(receiptId: string): { valid: boolean; reason?: string } {
  const receipt = retrievalReceipts.get(receiptId);
  if (!receipt) {
    return { valid: false, reason: 'Receipt not found' };
  }

  const { hash: _, ...receiptWithoutHash } = receipt;
  const expectedHash = computeReceiptHash(receiptWithoutHash);
  if (receipt.hash !== expectedHash) {
    return { valid: false, reason: 'Hash mismatch — receipt may have been tampered with' };
  }

  return { valid: true };
}

/**
 * Verify the integrity of an answer trace (hash check + receipt link)
 */
export function verifyTrace(traceId: string): { valid: boolean; reason?: string } {
  const trace = answerTraces.get(traceId);
  if (!trace) {
    return { valid: false, reason: 'Trace not found' };
  }

  // Check receipt exists
  const receiptExists = retrievalReceipts.has(trace.receiptId);
  if (!receiptExists) {
    return { valid: false, reason: `Referenced receipt ${trace.receiptId} not found` };
  }

  // Check hash
  const { hash: _, ...traceWithoutHash } = trace;
  const expectedHash = computeTraceHash(traceWithoutHash);
  if (trace.hash !== expectedHash) {
    return { valid: false, reason: 'Hash mismatch — trace may have been tampered with' };
  }

  return { valid: true };
}

/**
 * Get stats about stored receipts and traces
 */
export function getStats(): { receiptCount: number; traceCount: number } {
  return {
    receiptCount: retrievalReceipts.size,
    traceCount: answerTraces.size,
  };
}

/**
 * Clear all data — useful for testing
 */
export function clearAll(): void {
  retrievalReceipts.clear();
  answerTraces.clear();
}
