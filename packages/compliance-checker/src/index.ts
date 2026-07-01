/**
 * MyCodeXvantaOS Compliance Checker
 * Provides compliance checking against security standards and regulations
 */

export interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  check: () => Promise<{ compliant: boolean; details: string }>;
}

export interface ComplianceReport {
  timestamp: number;
  totalRules: number;
  compliantRules: number;
  nonCompliantRules: number;
  violations: ComplianceViolation[];
}

export interface ComplianceViolation {
  ruleId: string;
  ruleName: string;
  severity: string;
  message: string;
  recommendation: string;
}

export class ComplianceChecker {
  private rules: Map<string, ComplianceRule> = new Map();

  registerRule(rule: ComplianceRule): void {
    this.rules.set(rule.id, rule);
  }

  async checkCompliance(): Promise<ComplianceReport> {
    const violations: ComplianceViolation[] = [];
    let compliantCount = 0;

    for (const rule of this.rules.values()) {
      const result = await rule.check();
      if (result.compliant) {
        compliantCount++;
      } else {
        violations.push({
          ruleId: rule.id,
          ruleName: rule.name,
          severity: rule.severity,
          message: result.details,
          recommendation: `Fix compliance issue for ${rule.name}`,
        });
      }
    }

    return {
      timestamp: Date.now(),
      totalRules: this.rules.size,
      compliantRules: compliantCount,
      nonCompliantRules: violations.length,
      violations,
    };
  }

  async checkRule(ruleId: string): Promise<{ compliant: boolean; details: string }> {
    const rule = this.rules.get(ruleId);
    if (!rule) {
      return { compliant: false, details: `Rule ${ruleId} not found` };
    }
    return await rule.check();
  }

  getRules(): ComplianceRule[] {
    return Array.from(this.rules.values());
  }
}

export default ComplianceChecker;
