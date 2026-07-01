#!/usr/bin/env tsx
/**
 * ci/validate-architecture.ts
 *
 * Main CI architecture naming validator for mycodexvantaos platform.
 * Based on naming-spec-v1.md Section 14
 *
 * Hard enforcement  (Section 14.1): validation failure BLOCKS merge.
 * Soft enforcement  (Section 14.2): validation failure emits WARNING only.
 *
 * Usage:
 *   ts-node ci/validate-architecture.ts [--reporter=console|json|github] [--fail-on-soft]
 *   ts-node ci/validate-architecture.ts --help
 *
 * Exit codes:
 *   0 — all hard rules pass (soft warnings may exist)
 *   1 — one or more hard rules failed
 *   2 — --fail-on-soft flag set and soft warnings exist
 */

import fs from 'fs';
import path from 'path';
import { parseArgs } from 'util';
import { parse } from 'yaml';
import * as serviceIdRule from './rules/service-id.rule.js';
import * as modulePathRule from './rules/module-path.rule.js';
import * as packageNameRule from './rules/package-name.rule.js';
import * as manifestNameRule from './rules/manifest-name.rule.js';
import * as capabilityIdRule from './rules/capability-id.rule.js';
import * as providerInstanceRule from './rules/provider-instance.rule.js';
import * as envVarRule from './rules/env-var.rule.js';
import * as urnRule from './rules/urn.rule.js';
import * as forbiddenLegacyPrefixRule from './rules/forbidden-legacy-prefix.rule.js';
import * as noVersionInCanonicalRule from './rules/no-version-in-canonical.rule.js';
import * as noEnvironmentInCanonicalRule from './rules/no-environment-in-canonical.rule.js';
import * as vectorCollectionRule from './rules/vector-collection.rule.js';
import * as embeddingModelAliasRule from './rules/embedding-model-alias.rule.js';
import * as retrievalPipelineIdRule from './rules/retrieval-pipeline-id.rule.js';
import * as searchIndexIdRule from './rules/search-index-id.rule.js';
import * as graphNodeIdRule from './rules/graph-node-id.rule.js';
import * as graphDbIndexIdRule from './rules/graph-db-index-id.rule.js';
import * as timestampedIdRule from './rules/timestamped-id.rule.js';
import * as contentAddressedIdRule from './rules/content-addressed-id.rule.js';
import * as uuidBasedIdRule from './rules/uuid-based-id.rule.js';
import { validate } from './utils/regex-table.js';

// ─── Public Types ─────────────────────────────────────────────────────────────

export type EnforcementLevel = 'hard' | 'soft';

export interface RuleResult {
  ruleId: string;
  enforcement: EnforcementLevel;
  passed: boolean;
  target: string;
  message: string;
}

export interface ValidationContext {
  // Section 5.1 — All service-ids to validate
  serviceIds: string[];
  // Section 6.2 — Paths to module folders (e.g. "modules/mycodexvantaos-core-kernel")
  moduleFolderPaths: string[];
  // Section 7.1 — Pairs of (serviceId, packageName) for derivation check.
  // serviceId is omitted when discovery can only validate package naming format
  // and does not have an authoritative service-to-package mapping.
  packageEntries: Array<{ serviceId?: string; packageName: string }>;
  // Section 6.3 — Manifest entries for metadata.name consistency check
  manifestEntries: Array<{
    manifestPath: string;
    metadataName: string;
    expectedServiceId: string;
  }>;
  // Section 5.5 — Capability ids to validate
  capabilityIds: string[];
  // Section 8.1 — Provider instances to validate
  providerInstances: string[];
  // Section 7.2 — Environment variables to validate
  envVars: string[];
  // Section 7.5 — URNs to validate
  urns: string[];
  // Section 9.2
  vectorCollectionIds: string[];
  // Section 9.3
  embeddingModelAliases: string[];
  // Section 9.4
  retrievalPipelineIds: string[];
  // Section 9.5
  searchIndexIds: string[];
  // Section 9.6
  graphNodeIds: string[];
  // Section 10.3
  graphDbIndexIds: string[];
  // Section 9.8
  timestampedIds: string[];
  // Section 9.9
  contentAddressedIds: string[];
  // Section 9.10
  uuidBasedIds: string[];
  // Section 15 — approved naming exceptions
  exceptions?: NamingException[];
  // Non-canonical package.json entries skipped from strict package-name validation
  ignoredPackageEntries?: Array<{ directory: string; packageName: string }>;
}

interface NamingException {
  id: string;
  rule: string;
  scope: string;
  createdAt?: string;
  expiresAt?: string;
  status?: string;
}

interface CapabilitySetDocument {
  capabilities?: Array<{ id?: string }>;
}

interface ProviderRegistryDocument {
  providers?: Array<{ name?: string }>;
}

interface ExceptionRegisterDocument {
  exceptions?: NamingException[];
}

function isActiveException(exception: NamingException, now: Date = new Date()): boolean {
  if (!exception.rule || !exception.scope || exception.status === 'revoked') {
    return false;
  }

  if (!exception.expiresAt) {
    return true;
  }

  const expiresAt = new Date(exception.expiresAt);
  return !Number.isNaN(expiresAt.valueOf()) && expiresAt >= now;
}

function hasExactExceptionScope(target: string, exceptions: NamingException[] = []): boolean {
  return exceptions.some(
    (exception) => isActiveException(exception) && exception.scope.trim() === target
  );
}

export interface ValidationReport {
  timestamp: string;
  totalChecks: number;
  hardFailures: RuleResult[];
  softWarnings: RuleResult[];
  passed: RuleResult[];
  exitCode: number;
}

// ─── Context Discovery ────────────────────────────────────────────────────────

/**
 * Build a ValidationContext by scanning the repository filesystem.
 * Call this when running as a CLI tool.
 */
export function discoverContext(rootDir: string = '.'): ValidationContext {
  const ctx: ValidationContext = {
    serviceIds: [],
    moduleFolderPaths: [],
    packageEntries: [],
    manifestEntries: [],
    capabilityIds: [],
    providerInstances: [],
    envVars: [],
    urns: [],
    vectorCollectionIds: [],
    embeddingModelAliases: [],
    retrievalPipelineIds: [],
    searchIndexIds: [],
    graphNodeIds: [],
    graphDbIndexIds: [],
    timestampedIds: [],
    contentAddressedIds: [],
    uuidBasedIds: [],
    exceptions: [],
    ignoredPackageEntries: [],
  };

  const abs = (p: string) => path.resolve(rootDir, p);
  const readYaml = <T>(relativePath: string): T | null => {
    const filePath = abs(relativePath);
    if (!fs.existsSync(filePath)) return null;

    return parse(fs.readFileSync(filePath, 'utf-8')) as T;
  };

  const exceptions = readYaml<ExceptionRegisterDocument>('governance/exceptions.yaml');
  if (exceptions?.exceptions?.length) {
    ctx.exceptions = exceptions.exceptions;
  }

  // Discover service-ids from services/ folder names
  const servicesDir = abs('services');
  if (fs.existsSync(servicesDir)) {
    const entries = fs.readdirSync(servicesDir, { withFileTypes: true });
    for (const e of entries) {
      if (
        e.isDirectory() &&
        (validate('service-id', e.name) || hasExactExceptionScope(e.name, ctx.exceptions))
      ) {
        ctx.serviceIds.push(e.name);
      }
    }
  }

  // Discover module folder paths
  const modulesDir = abs('modules');
  if (fs.existsSync(modulesDir)) {
    const entries = fs.readdirSync(modulesDir, { withFileTypes: true });
    for (const e of entries) {
      if (e.isDirectory()) {
        ctx.moduleFolderPaths.push(path.join('modules', e.name));

        // Check manifest metadata.name
        const manifestPath = path.join(modulesDir, e.name, 'module-manifest.yaml');
        if (fs.existsSync(manifestPath)) {
          const content = fs.readFileSync(manifestPath, 'utf-8');
          const nameMatch = content.match(/^\s+name:\s+(.+)$/m);
          if (nameMatch) {
            ctx.manifestEntries.push({
              manifestPath: path.join('modules', e.name, 'module-manifest.yaml'),
              metadataName: nameMatch[1].trim(),
              expectedServiceId: e.name,
            });
          }
        }
      }
    }
  }

  // Discover package entries from packages/ folder
  const packagesDir = abs('packages');
  if (fs.existsSync(packagesDir)) {
    const entries = fs.readdirSync(packagesDir, { withFileTypes: true });
    for (const e of entries) {
      if (e.isDirectory()) {
        const pkgJson = path.join(packagesDir, e.name, 'package.json');
        if (fs.existsSync(pkgJson)) {
          const pkg = JSON.parse(fs.readFileSync(pkgJson, 'utf-8'));
          const packageName = typeof pkg.name === 'string' ? pkg.name : '';
          if (!validate('package-name', packageName)) {
            if (packageName && pkg.private !== true) {
              ctx.ignoredPackageEntries?.push({
                directory: path.join('packages', e.name),
                packageName,
              });
            }
            continue;
          }

          ctx.packageEntries.push({
            packageName,
          });
        }
      }
    }
  }

  // Discover capabilities from governance source-of-truth
  const capabilitySet = readYaml<CapabilitySetDocument>('governance/capability-set.yaml');
  if (capabilitySet?.capabilities?.length) {
    ctx.capabilityIds = capabilitySet.capabilities
      .map((capability) => capability.id?.trim())
      .filter((capabilityId): capabilityId is string => Boolean(capabilityId));
  } else {
    const providersDir = abs('providers');
    if (fs.existsSync(providersDir)) {
      const caps = fs.readdirSync(providersDir, { withFileTypes: true });
      for (const cap of caps) {
        if (cap.isDirectory()) ctx.capabilityIds.push(cap.name);
      }
    }
  }

  // Discover provider instances from governance source-of-truth
  const providerRegistry = readYaml<ProviderRegistryDocument>('governance/provider-registry.yaml');
  if (providerRegistry?.providers?.length) {
    ctx.providerInstances = providerRegistry.providers
      .map((provider) => provider.name?.trim())
      .filter((providerName): providerName is string => Boolean(providerName));
  } else {
    const providersDir = abs('providers');
    if (fs.existsSync(providersDir)) {
      const caps = fs.readdirSync(providersDir, { withFileTypes: true });
      for (const cap of caps) {
        if (!cap.isDirectory()) continue;
        const capDir = path.join(providersDir, cap.name);
        const provs = fs.readdirSync(capDir, { withFileTypes: true });
        for (const prov of provs) {
          if (prov.isDirectory()) ctx.providerInstances.push(prov.name);
        }
      }
    }
  }

  // Discover vector collections
  const vcDir = abs('vector-store/collections');
  if (fs.existsSync(vcDir)) {
    ctx.vectorCollectionIds = fs
      .readdirSync(vcDir)
      .filter((f) => f.endsWith('.yaml'))
      .map((f) => f.replace(/\.yaml$/, ''));
  }

  // Discover embedding model aliases
  const emaDir = abs('vector-store/embedding-model-aliases');
  if (fs.existsSync(emaDir)) {
    ctx.embeddingModelAliases = fs
      .readdirSync(emaDir)
      .filter((f) => f.endsWith('.yaml'))
      .map((f) => f.replace(/\.yaml$/, ''));
  }

  // Discover retrieval pipelines
  const rpDir = abs('vector-store/retrieval-pipelines');
  if (fs.existsSync(rpDir)) {
    ctx.retrievalPipelineIds = fs
      .readdirSync(rpDir)
      .filter((f) => f.endsWith('.yaml'))
      .map((f) => f.replace(/\.yaml$/, ''));
  }

  // Discover search indexes
  const siDir = abs('search-indexes');
  if (fs.existsSync(siDir)) {
    ctx.searchIndexIds = fs
      .readdirSync(siDir)
      .filter((f) => f.endsWith('.yaml'))
      .map((f) => f.replace(/\.yaml$/, ''));
  }

  // Discover graph db indexes
  const giDir = abs('knowledge-graph/indexes');
  if (fs.existsSync(giDir)) {
    ctx.graphDbIndexIds = fs
      .readdirSync(giDir)
      .filter((f) => f.endsWith('.yaml'))
      .map((f) => f.replace(/\.yaml$/, ''));
  }

  // Scan .env.example files for env vars
  for (const svcId of ctx.serviceIds) {
    const envFile = abs(`services/${svcId}/.env.example`);
    if (fs.existsSync(envFile)) {
      const lines = fs.readFileSync(envFile, 'utf-8').split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const varName = trimmed.split('=')[0].trim();
          if (varName) ctx.envVars.push(varName);
        }
      }
    }
  }

  return ctx;
}

function matchesException(result: RuleResult, exception: NamingException): boolean {
  if (exception.rule !== result.ruleId) {
    return false;
  }

  return exception.scope.trim() === result.target;
}

function buildIgnoredPackageWarnings(ctx: ValidationContext): RuleResult[] {
  return (ctx.ignoredPackageEntries ?? []).map(({ directory, packageName }) => ({
    ruleId: 'package-name-skip',
    enforcement: 'soft' as const,
    passed: false,
    target: packageName,
    message: `Skipped non-canonical package name "${packageName}" in ${directory}; add an explicit governance rule or rename it before enforcing strict package-name validation.`,
  }));
}

function applyExceptions(results: RuleResult[], exceptions: NamingException[] = []): RuleResult[] {
  const activeExceptions = exceptions.filter((exception) => isActiveException(exception));
  if (activeExceptions.length === 0) {
    return results;
  }

  return results.map((result) => {
    if (result.passed) {
      return result;
    }

    const exception = activeExceptions.find((candidate) => matchesException(result, candidate));
    if (!exception) {
      return result;
    }

    return {
      ...result,
      passed: true,
      message: `${result.message} [excepted by ${exception.id}]`,
    };
  });
}

// ─── Runner ───────────────────────────────────────────────────────────────────

export function runValidation(ctx: ValidationContext): ValidationReport {
  const allResults = applyExceptions(
    [
      ...serviceIdRule.run(ctx),
      ...modulePathRule.run(ctx),
      ...packageNameRule.run(ctx),
      ...manifestNameRule.run(ctx),
      ...capabilityIdRule.run(ctx),
      ...providerInstanceRule.run(ctx),
      ...envVarRule.run(ctx),
      ...urnRule.run(ctx),
      ...forbiddenLegacyPrefixRule.run(ctx),
      ...noVersionInCanonicalRule.run(ctx),
      ...noEnvironmentInCanonicalRule.run(ctx),
      ...vectorCollectionRule.run(ctx),
      ...embeddingModelAliasRule.run(ctx),
      ...retrievalPipelineIdRule.run(ctx),
      ...searchIndexIdRule.run(ctx),
      ...graphNodeIdRule.run(ctx),
      ...graphDbIndexIdRule.run(ctx),
      ...timestampedIdRule.run(ctx),
      ...contentAddressedIdRule.run(ctx),
      ...uuidBasedIdRule.run(ctx),
      ...buildIgnoredPackageWarnings(ctx),
    ],
    ctx.exceptions
  );

  const hardFailures = allResults.filter((r) => !r.passed && r.enforcement === 'hard');
  const softWarnings = allResults.filter((r) => !r.passed && r.enforcement === 'soft');
  const passed = allResults.filter((r) => r.passed);

  let exitCode = 0;
  if (hardFailures.length > 0) exitCode = 1;

  return {
    timestamp: new Date().toISOString(),
    totalChecks: allResults.length,
    hardFailures,
    softWarnings,
    passed,
    exitCode,
  };
}

// ─── Reporters ────────────────────────────────────────────────────────────────

function reportConsole(report: ValidationReport): void {
  const { hardFailures, softWarnings, passed, totalChecks } = report;

  console.log(`\n╔══ mycodexvantaos naming validator ══════════════════════════╗`);
  console.log(`  Timestamp : ${report.timestamp}`);
  console.log(`  Checks    : ${totalChecks}`);
  console.log(`  Passed    : ${passed.length}`);
  console.log(`  Hard fail : ${hardFailures.length}`);
  console.log(`  Soft warn : ${softWarnings.length}`);
  console.log(`╚═════════════════════════════════════════════════════════════╝\n`);

  if (hardFailures.length > 0) {
    console.error('HARD FAILURES (will block merge):');
    for (const r of hardFailures) {
      console.error(`  [FAIL][${r.ruleId}] ${r.message}`);
    }
    console.log();
  }

  if (softWarnings.length > 0) {
    console.warn('SOFT WARNINGS:');
    for (const r of softWarnings) {
      console.warn(`  [WARN][${r.ruleId}] ${r.message}`);
    }
    console.log();
  }

  if (hardFailures.length === 0 && softWarnings.length === 0) {
    console.log('  All checks passed.');
  }
}

function reportJson(report: ValidationReport): void {
  console.log(JSON.stringify(report, null, 2));
}

function reportGitHub(report: ValidationReport): void {
  for (const r of report.hardFailures) {
    console.log(`::error title=[${r.ruleId}]::${r.message}`);
  }
  for (const r of report.softWarnings) {
    console.log(`::warning title=[${r.ruleId}]::${r.message}`);
  }
}

// ─── CLI Entry ────────────────────────────────────────────────────────────────

function main(): void {
  const { values } = parseArgs({
    options: {
      reporter: { type: 'string', default: 'console' },
      'fail-on-soft': { type: 'boolean', default: false },
      root: { type: 'string', default: '.' },
      help: { type: 'boolean', default: false },
    },
  });

  if (values.help) {
    console.log(`
mycodexvantaos naming validator — naming-spec-v1.md Section 14

Usage:
  ts-node ci/validate-architecture.ts [options]

Options:
  --reporter=console|json|github   Output format (default: console)
  --fail-on-soft                   Exit code 2 if soft warnings exist
  --root=<path>                    Repository root (default: .)
  --help                           Show this help

Exit codes:
  0 — all hard rules pass
  1 — one or more hard rules failed
  2 — --fail-on-soft and soft warnings exist
    `);
    process.exit(0);
  }

  const ctx = discoverContext(values.root as string);
  const report = runValidation(ctx);

  const reporter = values.reporter as string;
  if (reporter === 'json') reportJson(report);
  else if (reporter === 'github') reportGitHub(report);
  else reportConsole(report);

  if (report.exitCode !== 0) process.exit(report.exitCode);
  if (values['fail-on-soft'] && report.softWarnings.length > 0) process.exit(2);
  process.exit(0);
}

main();
