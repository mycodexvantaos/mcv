#!/usr/bin/env ts-node
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
import * as serviceIdRule from './rules/service-id.rule';
import * as modulePathRule from './rules/module-path.rule';
import * as packageNameRule from './rules/package-name.rule';
import * as manifestNameRule from './rules/manifest-name.rule';
import * as capabilityIdRule from './rules/capability-id.rule';
import * as providerInstanceRule from './rules/provider-instance.rule';
import * as envVarRule from './rules/env-var.rule';
import * as urnRule from './rules/urn.rule';
import * as forbiddenLegacyPrefixRule from './rules/forbidden-legacy-prefix.rule';
import * as noVersionInCanonicalRule from './rules/no-version-in-canonical.rule';
import * as noEnvironmentInCanonicalRule from './rules/no-environment-in-canonical.rule';
import * as vectorCollectionRule from './rules/vector-collection.rule';
import * as embeddingModelAliasRule from './rules/embedding-model-alias.rule';
import * as retrievalPipelineIdRule from './rules/retrieval-pipeline-id.rule';
import * as searchIndexIdRule from './rules/search-index-id.rule';
import * as graphNodeIdRule from './rules/graph-node-id.rule';
import * as graphDbIndexIdRule from './rules/graph-db-index-id.rule';
import * as timestampedIdRule from './rules/timestamped-id.rule';
import * as contentAddressedIdRule from './rules/content-addressed-id.rule';
import * as uuidBasedIdRule from './rules/uuid-based-id.rule';

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
  // Section 7.1 — Pairs of (serviceId, packageName) for derivation check
  packageEntries: Array<{ serviceId: string; packageName: string }>;
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
  };

  const abs = (p: string) => path.resolve(rootDir, p);

  // Discover service-ids from services/ folder names
  const servicesDir = abs('services');
  if (fs.existsSync(servicesDir)) {
    const entries = fs.readdirSync(servicesDir, { withFileTypes: true });
    for (const e of entries) {
      if (e.isDirectory()) ctx.serviceIds.push(e.name);
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
          ctx.packageEntries.push({
            serviceId: `mycodexvantaos-${e.name}`,
            packageName: pkg.name ?? '',
          });
        }
      }
    }
  }

  // Discover provider instances from providers/ folder (two-level deep)
  const providersDir = abs('providers');
  if (fs.existsSync(providersDir)) {
    const caps = fs.readdirSync(providersDir, { withFileTypes: true });
    for (const cap of caps) {
      if (!cap.isDirectory()) continue;
      ctx.capabilityIds.push(cap.name);
      const capDir = path.join(providersDir, cap.name);
      const provs = fs.readdirSync(capDir, { withFileTypes: true });
      for (const prov of provs) {
        if (prov.isDirectory()) ctx.providerInstances.push(prov.name);
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

// ─── Runner ───────────────────────────────────────────────────────────────────

export function runValidation(ctx: ValidationContext): ValidationReport {
  const allResults: RuleResult[] = [
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
  ];

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
