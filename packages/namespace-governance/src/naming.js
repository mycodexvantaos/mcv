/**
 * Naming rule engine implementing the canonical constraints of the Namespace
 * Governance Closure Spec: §I.1 (global naming), §I.3.1/§I.3.2 (governance code
 * structure + regex), §I.6.2/§I.6.3 (repository naming + forbidden tokens).
 *
 * Rationale: every rule returns a structured Violation (not a boolean) so the
 * closure engine can aggregate a complete, actionable report in one pass —
 * "near-enough" boolean checks would hide which spec clause failed.
 */
import { violation } from './result.js';
import {
  PLANE_BY_NAMESPACE, DOMAINS, FUNCTIONS, ERA_RANGES, FORBIDDEN_REPO_TOKENS,
} from './vocabulary.js';

/** Canonical governance code regex (§I.3.2). */
export const CODE_REGEX = /^mycodexvantaos-[0-9]{5}$/;

/** Canonical repository name regex (§I.6.2). */
export const REPO_REGEX =
  /^(?:mycodexvantaos|softwareos)-[a-z0-9]+(?:-[a-z0-9]+)*-[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Generic machine-name shape: lowercase kebab-case, hyphen only (§I.1.1). */
const KEBAB_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Validate a generic machine-facing name against §I.1.1 constraints.
 * @param {string} name
 * @returns {import('./result.js').Violation[]}
 */
export function checkMachineName(name) {
  if (typeof name !== 'string' || name.length === 0) {
    return [violation('I.1.1', String(name), 'name must be a non-empty string')];
  }
  if (name.includes('_')) {
    return [violation('I.1.1', name, 'underscore is forbidden; use hyphen')];
  }
  if (name.includes('.')) {
    return [violation('I.1.1', name, 'semantic dot is forbidden in canonical names')];
  }
  if (name.includes(' ')) {
    return [violation('I.1.1', name, 'space is not a machine-stable separator')];
  }
  if (name !== name.toLowerCase()) {
    return [violation('I.1.1', name, 'uppercase is forbidden; use lowercase only')];
  }
  if (!KEBAB_REGEX.test(name)) {
    return [violation('I.1.1', name, 'name must be lowercase kebab-case')];
  }
  return [];
}

/**
 * Decompose a governance code into its era fields (§I.3.1).
 * @param {string} code Five-digit code, e.g. "50100".
 * @returns {{ layerGroup: number, domain: number, subtype: number, sequence: number, era: string }}
 */
export function decomposeCode(code) {
  const layerGroup = Number(code.slice(0, 2));
  const era = ERA_RANGES.find(([lo, hi]) => layerGroup >= lo && layerGroup <= hi);
  return {
    layerGroup,
    domain: Number(code.slice(2, 3)),
    subtype: Number(code.slice(3, 4)),
    sequence: Number(code.slice(4, 5)),
    era: era ? era[2] : 'unmapped',
  };
}

/**
 * Validate a full governance identifier `mycodexvantaos-NNNNN` (§I.3.2).
 * @param {string} id
 * @returns {import('./result.js').Violation[]}
 */
export function checkGovernanceCode(id) {
  if (!CODE_REGEX.test(id)) {
    return [violation('I.3.2', String(id),
      'governance code must match ^mycodexvantaos-[0-9]{5}$')];
  }
  return [];
}

/**
 * Validate a repository name against §I.6.2 (shape) and §I.6.3 (forbidden
 * tokens, registered namespace/domain/function vocabularies).
 * @param {string} name
 * @returns {import('./result.js').Violation[]}
 */
export function checkRepositoryName(name) {
  const base = checkMachineName(name);
  if (base.length > 0) return base;

  /** @type {import('./result.js').Violation[]} */
  const out = [];
  if (!REPO_REGEX.test(name)) {
    out.push(violation('I.6.2', name,
      'repository name must match {namespace}-{domain}-{function}'));
    return out;
  }

  const parts = name.split('-');
  const namespace = parts[0];
  const fn = parts[parts.length - 1];
  const domain = parts[1];

  if (!Object.prototype.hasOwnProperty.call(PLANE_BY_NAMESPACE, namespace)) {
    out.push(violation('I.7.1', namespace, 'namespace not in controlled vocabulary'));
  }
  if (!DOMAINS.includes(domain)) {
    out.push(violation('I.7.2', domain, 'domain not in controlled vocabulary'));
  }
  if (!FUNCTIONS.includes(fn)) {
    out.push(violation('I.7.3', fn, 'function not in controlled vocabulary'));
  }
  for (const token of FORBIDDEN_REPO_TOKENS) {
    if (parts.includes(token)) {
      out.push(violation('I.6.3', token,
        `forbidden token "${token}" (version/environment marker)`));
    }
  }
  return out;
}

/**
 * Plane dependency rule (§I.2.4): control-plane MUST NOT hard-depend on
 * product-plane runtime implementations.
 * @param {string} fromRepo Depending repository name.
 * @param {string} toRepo   Depended-upon repository name.
 * @returns {import('./result.js').Violation[]}
 */
export function checkPlaneDependency(fromRepo, toRepo) {
  const fromNs = String(fromRepo).split('-')[0];
  const toNs = String(toRepo).split('-')[0];
  const fromPlane = PLANE_BY_NAMESPACE[fromNs];
  const toPlane = PLANE_BY_NAMESPACE[toNs];
  if (fromPlane === 'control-plane' && toPlane === 'product-plane') {
    return [violation('I.2.4', `${fromRepo} -> ${toRepo}`,
      'control-plane MUST NOT hard-depend on product-plane; use a mediator '
      + '(registry/catalog/binding/contract/evidence channel)')];
  }
  return [];
}
