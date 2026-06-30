/**
 * MyCodexVantaOS Governance Policy Engine
 *
 * Service ID: mycodexvantaos-governance-policy-engine
 * Foundation: Governance Foundation
 * Capability: Policy-as-code evaluation, rule enforcement, exception management
 *
 * Machine Identity: mycodexvantaos
 */

export const SERVICE_ID = 'mycodexvantaos-governance-policy-engine';
export const SERVICE_VERSION = '1.0.0';

export type PolicyRuleResult = 'pass' | 'fail' | 'warning' | 'skip';
export type PolicySeverity = 'critical' | 'error' | 'warning' | 'info';

export interface PolicyRule {
  ruleId: string;
  name: string;
  description: string;
  severity: PolicySeverity;
  evaluate: (context: PolicyContext) => PolicyRuleEvaluation;
}

export interface PolicyContext {
  platform: 'mycodexvantaos';
  environment: string;
  subject: {
    type: 'service' | 'provider' | 'module' | 'namespace' | 'identifier' | 'url';
    id: string;
    value: unknown;
  };
  metadata: Record<string, unknown>;
}

export interface PolicyRuleEvaluation {
  ruleId: string;
  result: PolicyRuleResult;
  message: string;
  details?: Record<string, unknown>;
}

export interface PolicyEvaluationReport {
  evaluationId: string;
  timestamp: Date;
  context: PolicyContext;
  results: PolicyRuleEvaluation[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
    skipped: number;
  };
  overallResult: 'pass' | 'fail';
}

/**
 * Built-in identity policy rule.
 * Validates that machine identifiers use the correct prefix.
 */
const identityRule: PolicyRule = {
  ruleId: 'identity-rule',
  name: 'Identity Policy Rule',
  description: 'Validates machine identity compliance with L1 Constitution',
  severity: 'critical',
  evaluate(context: PolicyContext): PolicyRuleEvaluation {
    if (context.subject.type !== 'identifier') {
      return { ruleId: this.ruleId, result: 'skip', message: 'Not an identifier subject' };
    }

    const id = String(context.subject.value);
    const FORBIDDEN_PREFIXES = [
      'mycodexvanta-os',
      'codexvanta-os',
      'codexvanta',
      'codevantaos',
      'kubo',
      'axiom',
    ];

    for (const prefix of FORBIDDEN_PREFIXES) {
      if (id.startsWith(prefix)) {
        return {
          ruleId: this.ruleId,
          result: 'fail',
          message: `Identifier "${id}" uses forbidden prefix "${prefix}"`,
          details: { forbiddenPrefix: prefix, identifier: id },
        };
      }
    }

    if (!id.startsWith('mycodexvantaos')) {
      return {
        ruleId: this.ruleId,
        result: 'fail',
        message: `Identifier "${id}" must start with "mycodexvantaos"`,
        details: { identifier: id },
      };
    }

    return {
      ruleId: this.ruleId,
      result: 'pass',
      message: `Identifier "${id}" complies with identity policy`,
    };
  },
};

/**
 * Built-in URL domain contract rule.
 * Validates that production URLs use the canonical domain.
 */
const domainContractRule: PolicyRule = {
  ruleId: 'domain-contract-rule',
  name: 'Domain Contract Rule',
  description: 'Validates URL compliance with Domain & Deployment Contract',
  severity: 'critical',
  evaluate(context: PolicyContext): PolicyRuleEvaluation {
    if (context.subject.type !== 'url') {
      return { ruleId: this.ruleId, result: 'skip', message: 'Not a URL subject' };
    }

    const url = String(context.subject.value);
    const isProduction = context.environment === 'production';

    if (!isProduction) {
      return {
        ruleId: this.ruleId,
        result: 'skip',
        message: 'Domain contract only enforced in production',
      };
    }

    const FORBIDDEN_PATTERNS = [
      /\.github\.io/,
      /\.pages\.dev/,
      /\.vercel\.app/,
      /\.netlify\.app/,
      /\.run\.app/,
      /\.appspot\.com/,
      /\.cloudfunctions\.net/,
      /\.web\.app/,
      /\.firebaseapp\.com/,
    ];

    for (const pattern of FORBIDDEN_PATTERNS) {
      if (pattern.test(url)) {
        return {
          ruleId: this.ruleId,
          result: 'fail',
          message: `URL "${url}" matches forbidden vendor URL pattern ${pattern}. Use https://mycodexvantaos.com`,
          details: { url, pattern: pattern.toString() },
        };
      }
    }

    if (!url.startsWith('https://')) {
      return {
        ruleId: this.ruleId,
        result: 'fail',
        message: `URL "${url}" must use HTTPS in production`,
        details: { url },
      };
    }

    return {
      ruleId: this.ruleId,
      result: 'pass',
      message: `URL "${url}" complies with domain contract`,
    };
  },
};

/**
 * Built-in naming policy rule.
 * Validates kebab-case naming convention.
 */
const namingRule: PolicyRule = {
  ruleId: 'naming-rule',
  name: 'Naming Policy Rule',
  description: 'Validates kebab-case naming convention',
  severity: 'error',
  evaluate(context: PolicyContext): PolicyRuleEvaluation {
    if (context.subject.type !== 'identifier' && context.subject.type !== 'namespace') {
      return {
        ruleId: this.ruleId,
        result: 'skip',
        message: 'Not an identifier or namespace subject',
      };
    }

    const name = String(context.subject.value);
    const KEBAB_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

    if (!KEBAB_PATTERN.test(name)) {
      return {
        ruleId: this.ruleId,
        result: 'fail',
        message: `"${name}" does not comply with kebab-case naming convention`,
        details: { name, pattern: KEBAB_PATTERN.toString() },
      };
    }

    return {
      ruleId: this.ruleId,
      result: 'pass',
      message: `"${name}" complies with naming convention`,
    };
  },
};

/**
 * Governance Policy Engine
 * Evaluates policy rules against subjects and produces evaluation reports.
 */
export class GovernancePolicyEngine {
  private rules: Map<string, PolicyRule> = new Map();

  constructor() {
    // Register built-in rules
    this.registerRule(identityRule);
    this.registerRule(domainContractRule);
    this.registerRule(namingRule);
  }

  /**
   * Register a policy rule.
   */
  registerRule(rule: PolicyRule): void {
    this.rules.set(rule.ruleId, rule);
  }

  /**
   * Evaluate all applicable rules against a context.
   */
  evaluate(context: PolicyContext): PolicyEvaluationReport {
    const evaluationId = `eval-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const results: PolicyRuleEvaluation[] = [];

    for (const rule of this.rules.values()) {
      try {
        const result = rule.evaluate(context);
        results.push(result);
      } catch (error) {
        results.push({
          ruleId: rule.ruleId,
          result: 'fail',
          message: `Rule evaluation error: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    }

    const summary = {
      total: results.length,
      passed: results.filter((r) => r.result === 'pass').length,
      failed: results.filter((r) => r.result === 'fail').length,
      warnings: results.filter((r) => r.result === 'warning').length,
      skipped: results.filter((r) => r.result === 'skip').length,
    };

    const criticalFailures = results.filter((r) => {
      if (r.result !== 'fail') return false;
      const rule = this.rules.get(r.ruleId);
      return rule?.severity === 'critical' || rule?.severity === 'error';
    });

    return {
      evaluationId,
      timestamp: new Date(),
      context,
      results,
      summary,
      overallResult: criticalFailures.length > 0 ? 'fail' : 'pass',
    };
  }

  /**
   * Get all registered rules.
   */
  getRules(): PolicyRule[] {
    return Array.from(this.rules.values());
  }
}

// Default policy engine instance
export const policyEngine = new GovernancePolicyEngine();
