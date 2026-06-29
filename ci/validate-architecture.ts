/**
 * MyCodexVantaOS Architecture Validation Entry Point
 *
 * Runs all CI validation rules and generates reports.
 * Machine Identity: mycodexvantaos
 * Canonical URL: https://mycodexvantaos.com
 */

import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(__dirname, "..");
const MACHINE_IDENTITY = "mycodexvantaos";
const CANONICAL_URL = "https://mycodexvantaos.com";

interface ValidationResult {
  rule: string;
  result: "pass" | "fail" | "warning" | "skip";
  message: string;
}

const results: ValidationResult[] = [];

function checkFileExists(path: string, ruleName: string): void {
  const fullPath = join(ROOT, path);
  if (existsSync(fullPath)) {
    results.push({ rule: ruleName, result: "pass", message: `File exists: ${path}` });
  } else {
    results.push({ rule: ruleName, result: "fail", message: `Missing required file: ${path}` });
  }
}

// Identity rule
checkFileExists("governance/identity-policy.yaml", "identity-rule");

// Foundation rule
const foundations = [
  "compute-foundation", "data-foundation", "algorithm-foundation",
  "agent-foundation", "contract-foundation", "governance-foundation", "business-foundation"
];
for (const f of foundations) {
  checkFileExists(`foundation/${f}/foundation.yaml`, `foundation-rule-${f}`);
}

// Service catalog rule
checkFileExists("platform/service-catalog.yaml", "service-catalog-rule");

// Naming policy rule
checkFileExists("governance/naming-policy.schema.json", "naming-rule");

// Hash policy rule
checkFileExists("governance/hash-policy.yaml", "hash-policy-rule");

// Runtime mode rule
checkFileExists("governance/runtime-mode-policy.yaml", "runtime-mode-rule");

// Unified gates rule
checkFileExists("unified-gates/gate-catalog.yaml", "unified-gates-rule");

// Phase one freeze rule
checkFileExists("config/phase-one.config.yaml", "phase-one-freeze-rule");

// Report results
const passed = results.filter(r => r.result === "pass").length;
const failed = results.filter(r => r.result === "fail").length;

console.log(`Architecture Validation: ${failed === 0 ? "PASSED" : "FAILED"}`);
console.log(`Checks: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  for (const r of results.filter(r => r.result === "fail")) {
    console.error(`  FAIL: ${r.rule}: ${r.message}`);
  }
  process.exit(1);
}
