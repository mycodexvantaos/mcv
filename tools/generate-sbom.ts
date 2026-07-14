#!/usr/bin/env node
/**
 * @module tools/generate-sbom
 * @description Generates a CycloneDX Software Bill of Materials (SBOM) for the release.
 *
 * Produces:
 *   - release/artifacts/<version>/sbom.cyclonedx.json
 *
 * Usage:
 *   pnpm release:sbom
 *   pnpm release:sbom --version v0.1.0-rc.1
 *
 * The SBOM is generated from pnpm lockfile metadata and package.json dependencies.
 * No external SBOM tool is required — the generator produces CycloneDX JSON directly.
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

// ── Types ──────────────────────────────────────────────────────────

interface CycloneDXComponent {
  type: 'library' | 'application' | 'framework';
  'bom-ref': string;
  name: string;
  version: string;
  purl?: string;
  hashes?: Array<{ alg: string; content: string }>;
  properties?: Array<{ name: string; value: string }>;
}

interface CycloneDXSBOM {
  $schema: string;
  bomFormat: string;
  specVersion: string;
  serialNumber: string;
  version: number;
  metadata: {
    timestamp: string;
    tools: Array<{ name: string; version: string }>;
    component: {
      type: string;
      'bom-ref': string;
      name: string;
      version: string;
    };
  };
  components: CycloneDXComponent[];
}

// ── Helpers ────────────────────────────────────────────────────────

function git(command: string): string {
  try {
    return execSync(`git ${command}`, { encoding: 'utf-8' }).trim();
  } catch {
    return 'unknown';
  }
}

function getVersion(): string {
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--version' && args[i + 1]) {
      return args[i + 1];
    }
  }
  const tag = git('describe --tags --exact-match HEAD 2>/dev/null');
  if (tag && tag !== 'unknown') return tag;
  return process.env.npm_package_version ?? '0.1.0';
}

function generateUUID(): string {
  const { randomUUID } = require('node:crypto');
  return randomUUID();
}

// ── Main ───────────────────────────────────────────────────────────

function main(): void {
  const version = getVersion();
  const artifactsDir = resolve(process.cwd(), `release/artifacts/${version}`);

  console.log('\n📦 MyCodexVantaOS SBOM Generator (CycloneDX)');
  console.log(`   Version: ${version}`);
  console.log('━'.repeat(50));

  if (!existsSync(artifactsDir)) {
    mkdirSync(artifactsDir, { recursive: true });
  }

  const components: CycloneDXComponent[] = [];

  // ── Scan workspace packages ────────────────────────────────────
  const workspaceDirs = ['packages', 'services'];
  for (const dir of workspaceDirs) {
    if (!existsSync(dir)) continue;
    try {
      const entries = execSync(`ls -d ${dir}/*/`, { encoding: 'utf-8' })
        .trim()
        .split('\n')
        .filter(Boolean);
      for (const entry of entries) {
        const pkgJsonPath = resolve(entry, 'package.json');
        if (!existsSync(pkgJsonPath)) continue;
        try {
          const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'));
          if (pkgJson.name && pkgJson.version) {
            components.push({
              type: 'library',
              'bom-ref': `pkg:npm/${pkgJson.name}@${pkgJson.version}`,
              name: pkgJson.name,
              version: pkgJson.version,
              purl: `pkg:npm/${pkgJson.name}@${pkgJson.version}`,
              properties: [
                {
                  name: 'mycodexvantaos:layer',
                  value: dir === 'packages' ? 'control-plane' : 'service',
                },
              ],
            });
          }
        } catch {
          // Skip invalid package.json
        }
      }
    } catch {
      // Directory listing failed
    }
  }

  // ── Scan root dependencies ─────────────────────────────────────
  const rootPkgPath = resolve(process.cwd(), 'package.json');
  if (existsSync(rootPkgPath)) {
    const rootPkg = JSON.parse(readFileSync(rootPkgPath, 'utf-8'));
    const depSections = ['dependencies', 'devDependencies'];
    for (const section of depSections) {
      const deps = rootPkg[section] || {};
      for (const [name, versionSpec] of Object.entries(deps)) {
        // Skip workspace protocol deps (already covered above)
        if (typeof versionSpec === 'string' && versionSpec.startsWith('workspace:')) continue;

        const cleanVersion =
          typeof versionSpec === 'string' ? versionSpec.replace(/^[\^~>=]/, '') : '0.0.0';
        components.push({
          type: section === 'devDependencies' ? 'framework' : 'library',
          'bom-ref': `pkg:npm/${name}@${cleanVersion}`,
          name,
          version: cleanVersion,
          purl: `pkg:npm/${name}@${cleanVersion}`,
          properties: [
            {
              name: 'mycodexvantaos:scope',
              value: section === 'devDependencies' ? 'development' : 'runtime',
            },
          ],
        });
      }
    }
  }

  // ── Scan Python packages ───────────────────────────────────────
  const pythonDir = resolve(process.cwd(), 'python');
  if (existsSync(pythonDir)) {
    const pyPkgDirs = ['packages', 'apps'];
    for (const dir of pyPkgDirs) {
      const fullDir = resolve(pythonDir, dir);
      if (!existsSync(fullDir)) continue;
      try {
        const entries = execSync(`ls -d ${fullDir}/*/`, { encoding: 'utf-8' })
          .trim()
          .split('\n')
          .filter(Boolean);
        for (const entry of entries) {
          const pyProjectPath = resolve(entry, 'pyproject.toml');
          if (!existsSync(pyProjectPath)) continue;
          try {
            const content = readFileSync(pyProjectPath, 'utf-8');
            const nameMatch = content.match(/^name\s*=\s*["']([^"']+)["']/m);
            const versionMatch = content.match(/^version\s*=\s*["']([^"']+)["']/m);
            if (nameMatch && versionMatch) {
              components.push({
                type: dir === 'apps' ? 'application' : 'library',
                'bom-ref': `pkg:pypi/${nameMatch[1]}@${versionMatch[1]}`,
                name: nameMatch[1],
                version: versionMatch[1],
                purl: `pkg:pypi/${nameMatch[1]}@${versionMatch[1]}`,
                properties: [
                  { name: 'mycodexvantaos:layer', value: 'intelligence-plane' },
                  { name: 'mycodexvantaos:language', value: 'python' },
                ],
              });
            }
          } catch {
            // Skip invalid pyproject.toml
          }
        }
      } catch {
        // Directory listing failed
      }
    }
  }

  // ── Build CycloneDX document ───────────────────────────────────
  const sbom: CycloneDXSBOM = {
    $schema: 'https://cyclonedx.org/schema/bom-1.5.schema.json',
    bomFormat: 'CycloneDX',
    specVersion: '1.5',
    serialNumber: `urn:uuid:${generateUUID()}`,
    version: 1,
    metadata: {
      timestamp: new Date().toISOString(),
      tools: [
        {
          name: 'mycodexvantaos-sbom-generator',
          version: '1.0.0',
        },
      ],
      component: {
        type: 'application',
        'bom-ref': `pkg:npm/mycodexvantaos@${version}`,
        name: 'mycodexvantaos',
        version,
      },
    },
    components: components.sort((a, b) => a.name.localeCompare(b.name)),
  };

  const sbomPath = resolve(artifactsDir, 'sbom.cyclonedx.json');
  writeFileSync(sbomPath, JSON.stringify(sbom, null, 2) + '\n', 'utf-8');

  console.log(`\n  ✅ CycloneDX SBOM generated: ${sbomPath}`);
  console.log(`     Components: ${components.length}`);
  console.log(`     Spec version: ${sbom.specVersion}`);
  console.log('');
}

main();
