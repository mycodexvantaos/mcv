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
 *
 * The manifest includes:
 *   - version, commit, branch, buildTimestamp
 *   - runtime environment (node, platform, arch)
 *   - services list with name + version
 *   - governance enforcement flags
 *   - manifest hash for integrity verification
 */

import { execSync } from "node:child_process";
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { createHash } from "node:crypto";

// ──── Types ──────────────────────────────────────────────────────────────

export interface ServiceEntry {
  name: string;
  version: string;
}

export interface RuntimeInfo {
  nodeVersion: string;
  platform: string;
  arch: string;
}

export interface GovernanceInfo {
  auditEnforcement: boolean;
  knowledgeTraceEnforcement: boolean;
  dreamSafetyEnforcement: boolean;
}

export interface ReleaseManifest {
  version: string;
  commit: string;
  branch: string;
  buildTimestamp: string;
  runtime: RuntimeInfo;
  services: ServiceEntry[];
  governance: GovernanceInfo;
  manifestHash: string;
}

// ──── Helpers ────────────────────────────────────────────────────────────

function git(command: string): string {
  try {
    return execSync(`git ${command}`, { encoding: "utf-8" }).trim();
  } catch {
    return "unknown";
  }
}

function parseArgs(): { output: string } {
  const args = process.argv.slice(2);
  let output = "release/release-manifest.json";
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--output" && args[i + 1]) {
      output = args[i + 1];
      i++;
    }
  }
  return { output };
}

/**
 * Scan all service and package directories for their name and version.
 */
export function scanServices(): ServiceEntry[] {
  const services: ServiceEntry[] = [];
  const dirs = ["services", "packages"];

  for (const dir of dirs) {
    if (!existsSync(dir)) continue;

    try {
      const entries = execSync(`ls -d ${dir}/*/`, { encoding: "utf-8" })
        .trim()
        .split("\n")
        .filter(Boolean);

      for (const entry of entries) {
        const pkgJsonPath = resolve(entry, "package.json");
        if (existsSync(pkgJsonPath)) {
          try {
            const pkgJson = JSON.parse(readFileSync(pkgJsonPath, "utf-8"));
            if (pkgJson.name && pkgJson.version) {
              services.push({ name: pkgJson.name, version: pkgJson.version });
            }
          } catch {
            // Skip invalid package.json
          }
        }
      }
    } catch {
      // Directory listing failed
    }
  }

  return services.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Compute a SHA-256 hash of the manifest (excluding the hash field itself)
 * for integrity verification.
 */
export function computeManifestHash(manifest: Omit<ReleaseManifest, "manifestHash">): string {
  const data = JSON.stringify(manifest, Object.keys(manifest).sort());
  return createHash("sha256").update(data).digest("hex");
}

/**
 * Generate a release manifest from current git and environment metadata.
 */
export function generateManifest(): ReleaseManifest {
  const version = process.env.npm_package_version ?? "0.1.0";
  const commit = process.env.GIT_COMMIT ?? git("rev-parse HEAD");
  const branch = process.env.GIT_BRANCH ?? git("rev-parse --abbrev-ref HEAD");
  const buildTimestamp = process.env.BUILD_TIMESTAMP ?? new Date().toISOString();

  const runtime: RuntimeInfo = {
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
  };

  const services = scanServices();

  const governance: GovernanceInfo = {
    auditEnforcement: true,
    knowledgeTraceEnforcement: true,
    dreamSafetyEnforcement: true,
  };

  const manifestWithoutHash: Omit<ReleaseManifest, "manifestHash"> = {
    version,
    commit,
    branch,
    buildTimestamp,
    runtime,
    services,
    governance,
  };

  const manifestHash = computeManifestHash(manifestWithoutHash);

  return { ...manifestWithoutHash, manifestHash };
}

// ──── Main ───────────────────────────────────────────────────────────────

function main(): void {
  const { output } = parseArgs();
  const manifest = generateManifest();

  const outputPath = resolve(process.cwd(), output);
  const outputDir = dirname(outputPath);

  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  writeFileSync(outputPath, JSON.stringify(manifest, null, 2) + "\n", "utf-8");

  console.log(`✅ Release manifest written to ${outputPath}`);
  console.log(`   version:          ${manifest.version}`);
  console.log(`   commit:           ${manifest.commit}`);
  console.log(`   branch:           ${manifest.branch}`);
  console.log(`   buildTimestamp:   ${manifest.buildTimestamp}`);
  console.log(`   nodeVersion:      ${manifest.runtime.nodeVersion}`);
  console.log(`   platform:         ${manifest.runtime.platform}/${manifest.runtime.arch}`);
  console.log(`   services:         ${manifest.services.length}`);
  console.log(`   manifestHash:     ${manifest.manifestHash.slice(0, 16)}...`);
}

main();
