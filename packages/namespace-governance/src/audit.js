/**
 * Audit evidence builder. Every governance decision emits an immutable record
 * (charter: full-chain audit trail — actor, action, resource, result, hash,
 * requestId, correlationId). Hash is a content digest enabling tamper-evident
 * verification without external dependencies.
 *
 * Rationale: governance without auditable evidence is unverifiable; a stable
 * content hash lets CI / registry drift guards detect post-hoc mutation.
 */
import { createHash, randomUUID } from 'node:crypto';

/**
 * @typedef {Object} AuditRecord
 * @property {string}  actor
 * @property {string}  action
 * @property {string}  resource
 * @property {string}  result
 * @property {number}  violations
 * @property {string}  requestId
 * @property {string}  correlationId
 * @property {string}  timestamp ISO-8601 UTC.
 * @property {string}  hash      sha256 of the canonical payload.
 */

/**
 * Build a tamper-evident audit record for a closure decision.
 * @param {Object} input
 * @param {string} input.actor
 * @param {string} input.action
 * @param {string} input.resource
 * @param {boolean} input.passed
 * @param {number}  input.violations
 * @param {string}  [input.correlationId]
 * @returns {AuditRecord}
 */
export function buildAuditRecord(input) {
  const requestId = randomUUID();
  const correlationId = input.correlationId || requestId;
  const timestamp = new Date().toISOString();
  const payload = {
    actor: input.actor,
    action: input.action,
    resource: input.resource,
    result: input.passed ? 'pass' : 'fail',
    violations: input.violations,
    requestId,
    correlationId,
    timestamp,
  };
  const hash = createHash('sha256').update(JSON.stringify(payload)).digest('hex');
  return { ...payload, hash };
}
