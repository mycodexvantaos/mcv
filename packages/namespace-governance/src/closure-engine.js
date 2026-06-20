/**
 * Closure evaluation engine implementing the Namespace Governance Closure Spec
 * (8BFFa5JRUNmGUthU.md). Replaces the prior `{ passed: true }` stub with a real
 * aggregation of naming, governance-code, repository and plane-dependency rules.
 *
 * Rationale: closure must be provable, not asserted. The engine collects every
 * violation in a single deterministic pass (no early throw) and emits a
 * structured, auditable verdict — satisfying the "no near-enough solutions"
 * and "audit closure" requirements of Sec.I.0 / Sec.I.9.
 */
import {
  checkMachineName,
  checkGovernanceCode,
  checkRepositoryName,
  checkPlaneDependency,
  decomposeCode,
  CODE_REGEX,
} from './naming.js';
import { ok, err } from './result.js';

/**
 * @typedef {Object} ClosureContext
 * @property {string}   namespace Machine namespace under evaluation.
 * @property {Object}   [rules]   Optional sub-checks.
 * @property {string[]} [rules.codes] Governance codes to validate.
 * @property {string[]} [rules.repositories] Repository names to validate.
 * @property {Array<[string,string]>} [rules.dependencies] [from,to] repo pairs.
 */

export class ClosureEngine {
  /**
   * Evaluate a closure context against the full normative ruleset.
   * Pure and synchronous: identical input always yields identical verdict.
   * @param {ClosureContext} context
   * @returns {import('./result.js').Result<{ namespace: string, era: object|null, checked: number }>}
   */
  evaluate(context) {
    if (context === null || typeof context !== 'object') {
      return err([{ rule: 'I.0', subject: String(context), message: 'context must be an object' }]);
    }
    const namespace = context.namespace;
    /** @type {import('./result.js').Violation[]} */
    const violations = [...checkMachineName(namespace)];
    let checked = 1;

    const rules = context.rules || {};
    for (const code of rules.codes || []) {
      violations.push(...checkGovernanceCode(code));
      checked += 1;
    }
    for (const repo of rules.repositories || []) {
      violations.push(...checkRepositoryName(repo));
      checked += 1;
    }
    for (const pair of rules.dependencies || []) {
      if (!Array.isArray(pair) || pair.length !== 2) {
        violations.push({
          rule: 'I.2.4',
          subject: String(pair),
          message: 'dependency must be a [from, to] pair',
        });
      } else {
        violations.push(...checkPlaneDependency(pair[0], pair[1]));
      }
      checked += 1;
    }

    if (violations.length > 0) return err(violations);

    const firstCode = (rules.codes || []).find((c) => CODE_REGEX.test(c));
    return ok({
      namespace,
      era: firstCode ? decomposeCode(firstCode.replace('mycodexvantaos-', '')) : null,
      checked,
    });
  }
}

export const closureEngine = new ClosureEngine();
