#!/usr/bin/env node
/**
 * @module tools/generators/generate-release-manifest
 * @description Generates a release-manifest.json from git metadata and package versions.
 *
 * Usage:
 *   node --import tsx tools/generators/generate-release-manifest.ts [--output <path>]
 *
 * Defaults to writing `release/release-manifest.json`.
 * Designed to run at CI build time so that `GET /v1/version` and `GET /v1/runtime`
 * can serve accurate, verifiable build metadata.
 */

import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

// ── Helpers ────────────────────────────────────────────────────────────────

function git(command: string): string {
  try {
    return execSync(`git ${command}`, { encoding: 'utf-8' }).trim();
  } catch {
    return 'unknown';
  }
}

function parseArgs(): { output: string } {
  const args = process.argv.slice(2);
  let output = 'release/release-manifest.json';
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--output' && args[i + 1]) {
      output = args[i + 1];
      i++;
    }
  }
  return { output };
}

// ── Main ───────────────────────────────────────────────────────────────────

function main(): void {
  const { output } = parseArgs();

  const version = process.env.npm_package_version ?? '0.1.0';
  const commit = process.env.GIT_COMMIT ?? git('rev-parse HEAD');
  const branch = process.env.GIT_BRANCH ?? git('rev-parse --abbrev-ref HEAD');
  const buildTimestamp = process.env.BUILD_TIMESTAMP ?? new Date().toISOString();

  const manifest = {
    version,
    commit,
    branch,
    buildTimestamp,
    runtime: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
    },
    governance: {
      auditEnforcement: true,
      knowledgeTraceEnforcement: true,
      dreamSafetyEnforcement: true,
    },
  };

  const outputPath = resolve(process.cwd(), output);
  const outputDir = dirname(outputPath);

  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  writeFileSync(outputPath, JSON.stringify(manifest, null, 2) + '\n', 'utf-8');

  console.log(`✅ Release manifest written to ${outputPath}`);
  console.log(`   version:          ${manifest.version}`);
  console.log(`   commit:           ${manifest.commit}`);
  console.log(`   branch:           ${manifest.branch}`);
  console.log(`   buildTimestamp:   ${manifest.buildTimestamp}`);
  console.log(`   nodeVersion:      ${manifest.runtime.nodeVersion}`);
  console.log(`   platform:         ${manifest.runtime.platform}/${manifest.runtime.arch}`);
}

main();
