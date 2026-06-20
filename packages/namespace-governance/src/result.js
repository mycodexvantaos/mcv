/**
 * Minimal Result type (ok / err) for explicit, exception-free error handling
 * on the closure evaluation path, as mandated by the engineering charter
 * (Result/Option-style error handling, no thrown control flow on hot paths).
 *
 * Rationale: closure evaluation aggregates many independent rule violations;
 * a Result carrying a structured violation list is more auditable and testable
 * than throwing on the first failure.
 */

/**
 * @template T
 * @typedef {{ ok: true, value: T } | { ok: false, violations: Violation[] }} Result
 */

/**
 * @typedef {Object} Violation
 * @property {string} rule    Spec rule id, e.g. "I.3.2".
 * @property {string} subject The offending value.
 * @property {string} message Human-actionable explanation.
 */

/**
 * @template T
 * @param {T} value
 * @returns {{ ok: true, value: T }}
 */
export const ok = (value) => ({ ok: true, value });

/**
 * @param {Violation[]} violations
 * @returns {{ ok: false, violations: Violation[] }}
 */
export const err = (violations) => ({ ok: false, violations });

/**
 * Build a single Violation record.
 * @param {string} rule
 * @param {string} subject
 * @param {string} message
 * @returns {Violation}
 */
export const violation = (rule, subject, message) => ({ rule, subject, message });
