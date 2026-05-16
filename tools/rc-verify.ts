#!/usr/bin/env node
/**
 * @module tools/rc-verify
 * @description Release Candidate Verification Script
 *
 * Runs a comprehensive readiness check for the release candidate.
 * Covers: governance, contracts, policy, tests, manifest, docker, python.
 *
 * Usage:
 *   pnpm rc:verify
 *
 * Exit code: 0 if all checks pass, 1 if any check fails.
 * Checks that require unavailable infrastructure (GCP, Terraform, Cloudflare)
 * are classified as infrastructure-not-configured and skipped with a warning.
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

interface CheckResult {
  name: string;
  category: string;
  passed: boolean;
  skipped: boolean;
  detail: string;
}

const results: CheckResult[] = [];

function runCheck(
  name: string,
  category: string,
  fn: () => { passed: boolean; detail: string }
): void {
  try {
    const result = fn();
    results.push({ name, category, passed: result.passed, skipped: false, detail: result.detail });
    if (result.passed) {
      console.log(`  ✅ ${name}: ${result.detail}`);
    } else {
      console.log(`  ❌ ${name}: ${result.detail}`);
    }
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    results.push({ name, category, passed: false, skipped: false, detail });
    console.log(`  ❌ ${name}: ${detail}`);
  }
}

function skipCheck(name: string, category: string, reason: string): void {
  results.push({ name, category, passed: true, skipped: true, detail: reason });
  console.log(`  ⏭️  ${name}: SKIP (${reason})`);
}

function exec(command: string, options?: { cwd?: string }): string {
  try {
    return execSync(command, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      ...options,
    }).trim();
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string; message?: string };
    throw new Error(e.stderr?.trim() || e.stdout?.trim() || e.message || 'Command failed');
  }
}

console.log('\n🚀 MyCodeXvantaOS Release Candidate Verification\n');
console.log('━'.repeat(60));

// ── Category 1: Governance ──────────────────────────────────────────
console.log('\n📋 Governance:');

runCheck('Governance check passes', 'governance', () => {
  exec('pnpm governance:check');
  return { passed: true, detail: 'All governance checks passed' };
});

runCheck('Policy check passes', 'governance', () => {
  exec('pnpm policy:check');
  return { passed: true, detail: 'Policy checks passed' };
});

runCheck('Enforcement flags are present', 'governance', () => {
  const source = readFileSync('apps/api-node/index.ts', 'utf-8');
  const flags = [
    'auditEnforcementEnabled',
    'knowledgeTraceEnforcementEnabled',
    'dreamSafetyEnforcementEnabled',
    'auditEnforcementMiddleware',
    'knowledgeTraceEnforcementMiddleware',
    'dreamSafetyEnforcementMiddleware',
    'policyRuntimeEnforcement',
  ];
  const missing = flags.filter((f) => !source.includes(f));
  if (missing.length > 0) {
    return { passed: false, detail: `Missing flags: ${missing.join(', ')}` };
  }
  return { passed: true, detail: `All ${flags.length} enforcement flags present` };
});

// ── Category 2: Contracts ──────────────────────────────────────────
console.log('\n📄 Contracts:');

runCheck('Contract validation passes', 'contracts', () => {
  exec('pnpm contracts:validate');
  return { passed: true, detail: 'All contracts validated' };
});

runCheck('Service definitions load', 'contracts', () => {
  const servicesDir = 'contracts/service-definitions';
  if (!existsSync(servicesDir)) {
    return { passed: false, detail: 'contracts/service-definitions directory missing' };
  }
  const files = exec(`find ${servicesDir} -name '*.yaml' -o -name '*.yml' | wc -l`);
  const count = parseInt(files, 10);
  if (count < 5) {
    return { passed: false, detail: `Only ${count} service definitions found (expected >= 5)` };
  }
  return { passed: true, detail: `${count} service definitions found` };
});

runCheck('Resource kinds load', 'contracts', () => {
  const kindsDir = 'contracts/resource-kinds';
  if (!existsSync(kindsDir)) {
    return { passed: false, detail: 'contracts/resource-kinds directory missing' };
  }
  const files = exec(`find ${kindsDir} -name '*.yaml' -o -name '*.yml' | wc -l`);
  const count = parseInt(files, 10);
  if (count < 3) {
    return { passed: false, detail: `Only ${count} resource kinds found (expected >= 3)` };
  }
  return { passed: true, detail: `${count} resource kinds found` };
});

// ── Category 3: Policy ─────────────────────────────────────────────
console.log('\n🛡️ Policy:');

runCheck('Policy definitions load', 'policy', () => {
  const policiesDir = 'contracts/policies';
  if (!existsSync(policiesDir)) {
    return { passed: false, detail: 'contracts/policies directory missing' };
  }
  const files = exec(`find ${policiesDir} -name '*.yaml' -o -name '*.yml' | wc -l`);
  const count = parseInt(files, 10);
  if (count < 5) {
    return { passed: false, detail: `Only ${count} policies found (expected >= 5)` };
  }
  return { passed: true, detail: `${count} policies found` };
});

runCheck('Contract tests pass', 'policy', () => {
  exec('pnpm test:contracts');
  return { passed: true, detail: 'Contract SDK tests passed' };
});

runCheck('Service tests pass', 'policy', () => {
  exec('pnpm test:services');
  return { passed: true, detail: 'Service tests passed' };
});

// ── Category 4: Tests ──────────────────────────────────────────────
console.log('\n🧪 Tests:');

runCheck('TypeScript typecheck passes', 'tests', () => {
  exec('pnpm typecheck');
  return { passed: true, detail: 'TypeScript type check passed' };
});

runCheck('Unit tests pass', 'tests', () => {
  exec('pnpm test');
  return { passed: true, detail: 'Unit tests passed' };
});

runCheck('Format check passes', 'tests', () => {
  exec('pnpm format:check');
  return { passed: true, detail: 'Code format check passed' };
});

// ── Category 5: Manifest ───────────────────────────────────────────
console.log('\n📦 Manifest:');

runCheck('Release manifest generator exists', 'manifest', () => {
  if (!existsSync('tools/generators/generate-release-manifest.ts')) {
    return { passed: false, detail: 'generate-release-manifest.ts not found' };
  }
  return { passed: true, detail: 'Release manifest generator present' };
});

runCheck('Release manifest generates successfully', 'manifest', () => {
  exec('pnpm generate-release-manifest');
  if (!existsSync('release/release-manifest.json')) {
    return { passed: false, detail: 'release/release-manifest.json not generated' };
  }
  const manifest = JSON.parse(readFileSync('release/release-manifest.json', 'utf-8'));
  if (!manifest.version || !manifest.commit || !manifest.manifestHash) {
    return {
      passed: false,
      detail: 'Manifest missing required fields (version, commit, manifestHash)',
    };
  }
  return { passed: true, detail: `Manifest v${manifest.version} @ ${manifest.commit.slice(0, 8)}` };
});

runCheck('Release manifest schema exists', 'manifest', () => {
  if (!existsSync('release/release-manifest.schema.json')) {
    return { passed: false, detail: 'release-manifest.schema.json not found' };
  }
  return { passed: true, detail: 'Release manifest schema present' };
});

// ── Category 6: Docker ─────────────────────────────────────────────
console.log('\n🐳 Docker:');

runCheck('Dockerfile exists', 'docker', () => {
  if (!existsSync('Dockerfile')) {
    return { passed: false, detail: 'Dockerfile not found' };
  }
  return { passed: true, detail: 'Dockerfile present' };
});

runCheck('Docker smoke test script exists', 'docker', () => {
  if (!existsSync('scripts/smoke/docker-smoke.sh')) {
    return { passed: false, detail: 'scripts/smoke/docker-smoke.sh not found' };
  }
  return { passed: true, detail: 'Docker smoke test script present' };
});

// Docker build is skipped in rc:verify — it's covered by the CI workflow
skipCheck('Docker build + smoke test', 'docker', 'covered by docker-smoke.yml CI workflow');

// ── Category 7: Python ─────────────────────────────────────────────
console.log('\n🐍 Python:');

runCheck('Python workspace structure is valid', 'python', () => {
  if (!existsSync('python')) {
    return { passed: false, detail: 'python/ directory not found' };
  }
  if (!existsSync('python/pyproject.toml')) {
    return { passed: false, detail: 'python/pyproject.toml not found' };
  }
  return { passed: true, detail: 'Python workspace structure valid' };
});

runCheck('Python packages exist', 'python', () => {
  if (!existsSync('python/packages')) {
    return { passed: false, detail: 'python/packages/ directory not found' };
  }
  const count = parseInt(exec('ls -d python/packages/*/ 2>/dev/null | wc -l'), 10);
  if (count < 4) {
    return { passed: false, detail: `Only ${count} Python packages found (expected >= 4)` };
  }
  return { passed: true, detail: `${count} Python packages found` };
});

runCheck('Python apps exist', 'python', () => {
  if (!existsSync('python/apps')) {
    return { passed: false, detail: 'python/apps/ directory not found' };
  }
  const count = parseInt(exec('ls -d python/apps/*/ 2>/dev/null | wc -l'), 10);
  if (count < 2) {
    return { passed: false, detail: `Only ${count} Python apps found (expected >= 2)` };
  }
  return { passed: true, detail: `${count} Python apps found` };
});

// Python runtime tests are skipped in rc:verify — they require venv setup covered by python-ci.yml
skipCheck(
  'Python unit tests',
  'python',
  'requires venv setup — covered by python-ci.yml CI workflow'
);

// ── Category 8: Infrastructure (skipped) ───────────────────────────
console.log('\n☁️ Infrastructure:');

skipCheck(
  'GCP / Terraform Cloud',
  'infrastructure',
  'infrastructure-not-configured — no .tf files in repo'
);
skipCheck(
  'Cloudflare deployment',
  'infrastructure',
  'infrastructure-not-configured — no CF_API_TOKEN secret in CI'
);
skipCheck(
  'Kubernetes deployment',
  'infrastructure',
  'infrastructure-not-configured — no K8s cluster configured'
);

// ── Summary ─────────────────────────────────────────────────────────
console.log('\n' + '━'.repeat(60));
console.log('\n📊 Release Candidate Verification Summary:\n');

const categories = [...new Set(results.map((r) => r.category))];
let totalPassed = 0;
let totalFailed = 0;
let totalSkipped = 0;

for (const cat of categories) {
  const catResults = results.filter((r) => r.category === cat);
  const passed = catResults.filter((r) => r.passed && !r.skipped).length;
  const failed = catResults.filter((r) => !r.passed && !r.skipped).length;
  const skipped = catResults.filter((r) => r.skipped).length;
  totalPassed += passed;
  totalFailed += failed;
  totalSkipped += skipped;

  const icon = failed > 0 ? '❌' : '✅';
  const skipNote = skipped > 0 ? ` (${skipped} skipped)` : '';
  console.log(`  ${icon} ${cat}: ${passed}/${passed + failed} passed${skipNote}`);
}

console.log(`\n  Total: ${totalPassed} passed, ${totalFailed} failed, ${totalSkipped} skipped`);

if (totalFailed > 0) {
  console.log('\n❌ Release candidate NOT ready — failing checks:\n');
  for (const r of results.filter((r) => !r.passed && !r.skipped)) {
    console.log(`  • [${r.category}] ${r.name}: ${r.detail}`);
  }
  console.log('');
  process.exit(1);
} else {
  console.log('\n✅ Release candidate is READY for v0.1.0-rc.1\n');
  process.exit(0);
}
