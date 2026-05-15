/**
 * Knowledge Trace Service Tests
 * Tests retrieval receipt creation, answer trace lifecycle, and integrity verification.
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  createSearchReceipt,
  createSearchReceiptWithResults,
  getReceipt,
  queryReceipts,
  createAnswerTrace,
  getTrace,
  getTracesByReceipt,
  queryTraces,
  verifyReceipt,
  verifyTrace,
  getStats,
  clearAll,
  type SearchResult,
} from '../index.js';

describe('Knowledge Trace Service', () => {
  beforeEach(() => {
    clearAll();
  });

  // ─── Retrieval Receipts ────────────────────────────────────────────

  describe('createSearchReceipt', () => {
    it('should create a receipt with empty results', () => {
      const { receipt } = createSearchReceipt({ query: 'What is audit policy?' });
      assert.ok(receipt.receiptId.startsWith('rcpt_'));
      assert.equal(receipt.query, 'What is audit policy?');
      assert.equal(receipt.results.length, 0);
      assert.equal(receipt.totalResults, 0);
      assert.equal(receipt.evidenceLevel, 'knowledge-assisted');
      assert.ok(receipt.hash);
    });

    it('should create a receipt with collection IDs', () => {
      const { receipt } = createSearchReceipt({
        query: 'test',
        collectionIds: ['col-001', 'col-002'],
      });
      assert.deepEqual(receipt.collectionIds, ['col-001', 'col-002']);
    });

    it('should respect topK and evidenceLevel', () => {
      const { receipt } = createSearchReceipt({
        query: 'test',
        topK: 5,
        evidenceLevel: 'knowledge-grounded',
      });
      assert.equal(receipt.topK, 5);
      assert.equal(receipt.evidenceLevel, 'knowledge-grounded');
    });
  });

  describe('createSearchReceiptWithResults', () => {
    it('should create a receipt with results trimmed to topK', () => {
      const results: SearchResult[] = [
        { chunkId: 'chunk-1', content: 'Result 1', score: 0.9 },
        { chunkId: 'chunk-2', content: 'Result 2', score: 0.8 },
        { chunkId: 'chunk-3', content: 'Result 3', score: 0.7 },
      ];

      const { receipt } = createSearchReceiptWithResults(
        { query: 'test', topK: 2 },
        results
      );

      assert.equal(receipt.results.length, 2);
      assert.equal(receipt.totalResults, 2);
      assert.equal(receipt.results[0].chunkId, 'chunk-1');
      assert.equal(receipt.results[1].chunkId, 'chunk-2');
    });
  });

  describe('getReceipt', () => {
    it('should return null for non-existent receipt', () => {
      assert.equal(getReceipt('nonexistent'), null);
    });

    it('should return the receipt by ID', () => {
      const { receipt } = createSearchReceipt({ query: 'test' });
      const retrieved = getReceipt(receipt.receiptId);
      assert.ok(retrieved);
      assert.equal(retrieved.receiptId, receipt.receiptId);
    });
  });

  describe('queryReceipts', () => {
    it('should return all receipts with pagination', () => {
      createSearchReceipt({ query: 'test 1', collectionIds: ['col-a'] });
      createSearchReceipt({ query: 'test 2', collectionIds: ['col-b'] });
      createSearchReceipt({ query: 'test 3', collectionIds: ['col-a'] });

      const result = queryReceipts();
      assert.equal(result.total, 3);
    });

    it('should filter by collectionId', () => {
      createSearchReceipt({ query: 'test 1', collectionIds: ['col-a'] });
      createSearchReceipt({ query: 'test 2', collectionIds: ['col-b'] });

      const result = queryReceipts({ collectionId: 'col-a' });
      assert.equal(result.total, 1);
    });

    it('should support pagination', () => {
      for (let i = 0; i < 5; i++) {
        createSearchReceipt({ query: `test ${i}` });
      }

      const page1 = queryReceipts({ limit: 2, offset: 0 });
      assert.equal(page1.receipts.length, 2);
      assert.equal(page1.total, 5);

      const page2 = queryReceipts({ limit: 2, offset: 2 });
      assert.equal(page2.receipts.length, 2);
    });
  });

  // ─── Answer Traces ────────────────────────────────────────────────

  describe('createAnswerTrace', () => {
    it('should create an answer trace linked to a receipt', () => {
      const { receipt } = createSearchReceipt({ query: 'What is audit policy?' });
      const { trace } = createAnswerTrace({
        receiptId: receipt.receiptId,
        answer: 'The audit policy requires 7-year retention.',
        citations: [{ chunkId: 'chunk-1', text: 'Audit retention: 2555 days' }],
      });

      assert.ok(trace.traceId.startsWith('trace_'));
      assert.equal(trace.receiptId, receipt.receiptId);
      assert.equal(trace.query, 'What is audit policy?');
      assert.equal(trace.answer, 'The audit policy requires 7-year retention.');
      assert.equal(trace.citations.length, 1);
      assert.equal(trace.evidenceLevel, 'knowledge-assisted');
      assert.ok(trace.hash);
    });

    it('should throw if receipt does not exist', () => {
      assert.throws(
        () => createAnswerTrace({ receiptId: 'nonexistent', answer: 'test' }),
        /Retrieval receipt not found/
      );
    });

    it('should inherit evidence level from receipt if not specified', () => {
      const { receipt } = createSearchReceipt({ query: 'test', evidenceLevel: 'knowledge-grounded' });
      const { trace } = createAnswerTrace({
        receiptId: receipt.receiptId,
        answer: 'test answer',
      });
      assert.equal(trace.evidenceLevel, 'knowledge-grounded');
    });

    it('should override evidence level when specified', () => {
      const { receipt } = createSearchReceipt({ query: 'test', evidenceLevel: 'knowledge-assisted' });
      const { trace } = createAnswerTrace({
        receiptId: receipt.receiptId,
        answer: 'test answer',
        evidenceLevel: 'knowledge-verified',
      });
      assert.equal(trace.evidenceLevel, 'knowledge-verified');
    });
  });

  describe('getTrace', () => {
    it('should return null for non-existent trace', () => {
      assert.equal(getTrace('nonexistent'), null);
    });

    it('should return the trace by ID', () => {
      const { receipt } = createSearchReceipt({ query: 'test' });
      const { trace } = createAnswerTrace({
        receiptId: receipt.receiptId,
        answer: 'test answer',
      });
      const retrieved = getTrace(trace.traceId);
      assert.ok(retrieved);
      assert.equal(retrieved.traceId, trace.traceId);
    });
  });

  describe('getTracesByReceipt', () => {
    it('should return all traces for a receipt', () => {
      const { receipt } = createSearchReceipt({ query: 'test' });
      createAnswerTrace({ receiptId: receipt.receiptId, answer: 'answer 1' });
      createAnswerTrace({ receiptId: receipt.receiptId, answer: 'answer 2' });

      const traces = getTracesByReceipt(receipt.receiptId);
      assert.equal(traces.length, 2);
    });
  });

  describe('queryTraces', () => {
    it('should filter by receiptId', () => {
      const { receipt: r1 } = createSearchReceipt({ query: 'test 1' });
      const { receipt: r2 } = createSearchReceipt({ query: 'test 2' });
      createAnswerTrace({ receiptId: r1.receiptId, answer: 'a1' });
      createAnswerTrace({ receiptId: r2.receiptId, answer: 'a2' });

      const result = queryTraces({ receiptId: r1.receiptId });
      assert.equal(result.total, 1);
    });

    it('should filter by evidenceLevel', () => {
      const { receipt } = createSearchReceipt({ query: 'test', evidenceLevel: 'knowledge-grounded' });
      createAnswerTrace({ receiptId: receipt.receiptId, answer: 'a1' });
      createAnswerTrace({ receiptId: receipt.receiptId, answer: 'a2', evidenceLevel: 'knowledge-assisted' });

      const result = queryTraces({ evidenceLevel: 'knowledge-assisted' });
      assert.equal(result.total, 1);
    });
  });

  // ─── Integrity Verification ───────────────────────────────────────

  describe('verifyReceipt', () => {
    it('should verify a valid receipt', () => {
      const { receipt } = createSearchReceipt({ query: 'test' });
      const result = verifyReceipt(receipt.receiptId);
      assert.equal(result.valid, true);
    });

    it('should fail for non-existent receipt', () => {
      const result = verifyReceipt('nonexistent');
      assert.equal(result.valid, false);
      assert.equal(result.reason, 'Receipt not found');
    });
  });

  describe('verifyTrace', () => {
    it('should verify a valid trace', () => {
      const { receipt } = createSearchReceipt({ query: 'test' });
      const { trace } = createAnswerTrace({ receiptId: receipt.receiptId, answer: 'test' });
      const result = verifyTrace(trace.traceId);
      assert.equal(result.valid, true);
    });

    it('should fail for non-existent trace', () => {
      const result = verifyTrace('nonexistent');
      assert.equal(result.valid, false);
    });
  });

  // ─── Stats ────────────────────────────────────────────────────────

  describe('getStats', () => {
    it('should return correct counts', () => {
      assert.deepEqual(getStats(), { receiptCount: 0, traceCount: 0 });

      const { receipt } = createSearchReceipt({ query: 'test' });
      assert.deepEqual(getStats(), { receiptCount: 1, traceCount: 0 });

      createAnswerTrace({ receiptId: receipt.receiptId, answer: 'test' });
      assert.deepEqual(getStats(), { receiptCount: 1, traceCount: 1 });
    });
  });
});
