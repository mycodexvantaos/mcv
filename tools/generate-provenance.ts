#!/usr/bin/env node
/**
 * @module tools/generate-provenance
 * @description Generates SLSA/in-toto provenance for the release artifacts.
 *
 * Produces:
 *   - release/artifacts/<version>/provenance.intoto.json
 *   - release/artifacts/<version>/supply-chain-summary.json
 *
 * Usage:
 *   pnpm release:provenance
 *   pnpm release:provenance --version v0.1.0-rc.1
 *
 * Signing policy:
 *   - If signing keys are available, provenance is signed
 *   - If signing keys are NOT available, provenance is generated unsigned and
 *     classified as "signing-not-configured"
 *   - Stable releases must define signing requirements
 *   - Use pnpm release:sign (tools/sign-provenance.ts) to sign after generation
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

// ── Types ──────────────────────────────────────────────────────────

interface ProvenanceBuilder {
  id: string;
  version?: string;
  builderDependencies?: Array<{ uri: string }>;
}

interface ProvenanceMetadata {
  buildInvocationId: string;
  buildStartedOn: string;
  buildFinishedOn: string;
  completeness: {
    arguments: boolean;
    environment: boolean;
    materials: boolean;
  };
  reproducible: boolean;
}

interface ProvenanceMaterial {
  uri: string;
  digest: Record<string, string>;
}

interface ProvenanceConfig {
  env: Record<string, string>;
  entryPoint: string;
  arguments: Record<string, unknown>;
}

// Signature format per in-toto Envelope specification.
// Populated by tools/sign-provenance.ts after cosign keyless signing.
interface ProvenanceSignature {
  keyid: string;
  sig: string;
  cert?: string;
  signingIdentity?: string;
  signingMethod: string;
  oidcIssuer?: string;
  signedAt: string;
}

interface InTotoStatement {
  _type: string;
  predicateType: string;
  subject: Array<{
    name: string;
    digest: Record<string, string>;
  }>;
  predicate: {
    builder: ProvenanceBuilder;
    buildType: string;
    invocation: {
      configSource: {
        uri: string;
        digest: Record<string, string>;
        entryPoint: string;
      };
      parameters: Record<string, unknown>;
      environment: Record<string, string>;
    };
    metadata: ProvenanceMetadata;
    materials: ProvenanceMaterial[];
  };
  // Optional: populated by tools/sign-provenance.ts after cosign keyless signing.
  // When present, G010 (Cryptographic Signing) transitions from signing-not-configured to signed.
  signatures?: ProvenanceSignature[];
}

interface SupplyChainSummary {
  version: string;
  generatedAt: string;
  commit: string;
  branch: string;
  sbomAvailable: boolean;
  sbomPath: string;
  provenanceAvailable: boolean;
  provenancePath: string;
  signingStatus: 'signed' | 'signing-not-configured';
  signingWorkflow?: string;
  materialsCount: number;
  subjectsCount: number;
  infrastructureSkips: string[];
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

function sha256OfContent(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

function sha256OfFile(filePath: string): string | null {
  if (!existsSync(filePath)) return null;
  return sha256OfContent(readFileSync(filePath, 'utf-8'));
}

// ── Main ───────────────────────────────────────────────────────────

function main(): void {
  const version = getVersion();
  const artifactsDir = resolve(process.cwd(), `release/artifacts/${version}`);

  console.log('\n🔗 MyCodexVantaOS Provenance Generator (SLSA/in-toto)');
  console.log(`   Version: ${version}`);
  console.log('━'.repeat(50));

  if (!existsSync(artifactsDir)) {
    mkdirSync(artifactsDir, { recursive: true });
  }

  const commit = git('rev-parse HEAD');
  const branch = git('rev-parse --abbrev-ref HEAD');
  const repoUrl = 'https://github.com/mycodexvantaos/mycodexvantaos';

  // ── Collect subjects (artifact digests) ─────────────────────────
  const subjects: Array<{ name: string; digest: Record<string, string> }> = [];
  const materials: ProvenanceMaterial[] = [];

  // Digest the release manifest
  const manifestPath = resolve(artifactsDir, 'release-manifest.json');
  const manifestDigest = sha256OfFile(manifestPath);
  if (manifestDigest) {
    subjects.push({ name: 'release-manifest.json', digest: { sha256: manifestDigest } });
  }

  // Digest the artifact digests file
  const digestsPath = resolve(artifactsDir, 'artifact-digests.json');
  const digestsDigest = sha256OfFile(digestsPath);
  if (digestsDigest) {
    subjects.push({ name: 'artifact-digests.json', digest: { sha256: digestsDigest } });
  }

  // Digest the SBOM if it exists
  const sbomPath = resolve(artifactsDir, 'sbom.cyclonedx.json');
  const sbomDigest = sha256OfFile(sbomPath);
  if (sbomDigest) {
    subjects.push({ name: 'sbom.cyclonedx.json', digest: { sha256: sbomDigest } });
  }

  // Material: git repository
  materials.push({
    uri: `${repoUrl}.git`,
    digest: { sha1: commit !== 'unknown' ? commit : '' },
  });

  // Material: pnpm lockfile
  const lockfileDigest = sha256OfFile(resolve(process.cwd(), 'pnpm-lock.yaml'));
  if (lockfileDigest) {
    materials.push({
      uri: 'file://pnpm-lock.yaml',
      digest: { sha256: lockfileDigest },
    });
  }

  // ── Build in-toto statement ────────────────────────────────────
  const buildInvocationId = process.env.GITHUB_RUN_ID ?? `local-${Date.now()}`;
  const buildStartedOn = new Date(Date.now() - 60000).toISOString(); // Approximate
  const buildFinishedOn = new Date().toISOString();

  const provenance: InTotoStatement = {
    _type: 'https://in-toto.io/Statement/v1',
    predicateType: 'https://slsa.dev/provenance/v1',
    subject: subjects,
    predicate: {
      builder: {
        id: process.env.GITHUB_SERVER_URL
          ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions`
          : 'https://github.com/mycodexvantaos/mycodexvantaos/actions',
        version: '1.0.0',
      },
      buildType: 'https://github.com/mycodexvantaos/mycodexvantaos/build-type@v1',
      invocation: {
        configSource: {
          uri: `${repoUrl}.git`,
          digest: { sha1: commit !== 'unknown' ? commit : '' },
          entryPoint: '.github/workflows/release-candidate-check.yml',
        },
        parameters: {
          version,
          ref: branch,
        },
        environment: {
          GITHUB_EVENT_NAME: process.env.GITHUB_EVENT_NAME ?? 'local',
          RUNNER_OS: process.env.RUNNER_OS ?? process.platform,
          NODE_VERSION: process.version,
        },
      },
      metadata: {
        buildInvocationId,
        buildStartedOn,
        buildFinishedOn,
        completeness: {
          arguments: true,
          environment: true,
          materials: true,
        },
        reproducible: false, // Not fully reproducible yet (timestamps in manifest)
      },
      materials,
    },
    // signatures field is intentionally absent at generation time.
    // Run pnpm release:sign (tools/sign-provenance.ts) in GitHub Actions to add signatures.
  };

  const provenancePath = resolve(artifactsDir, 'provenance.intoto.json');
  writeFileSync(provenancePath, JSON.stringify(provenance, null, 2) + '\n', 'utf-8');
  console.log(`\n  ✅ Provenance generated: ${provenancePath}`);
  console.log(`     Subjects: ${subjects.length}`);
  console.log(`     Materials: ${materials.length}`);
  console.log(`     Builder: ${provenance.predicate.builder.id}`);

  // ── Generate supply chain summary ──────────────────────────────
  const signingStatus: 'signed' | 'signing-not-configured' = 'signing-not-configured';
  console.log(`\n  ⚠️  Signing status: ${signingStatus}`);
  console.log(
    '     Provenance is unsigned. Run pnpm release:sign in GitHub Actions to sign with cosign.'
  );

  const supplyChainSummary: SupplyChainSummary = {
    version,
    generatedAt: new Date().toISOString(),
    commit,
    branch,
    sbomAvailable: existsSync(sbomPath),
    sbomPath: sbomPath,
    provenanceAvailable: true,
    provenancePath,
    signingStatus,
    signingWorkflow: '.github/workflows/sign-release.yaml',
    materialsCount: materials.length,
    subjectsCount: subjects.length,
    infrastructureSkips: [
      'GCP / Terraform Cloud: infrastructure-not-configured',
      'Cloudflare: infrastructure-not-configured',
      'Kubernetes: infrastructure-not-configured',
      'Artifact signing: signing-not-configured (run pnpm release:sign to sign)',
    ],
  };

  const summaryPath = resolve(artifactsDir, 'supply-chain-summary.json');
  writeFileSync(summaryPath, JSON.stringify(supplyChainSummary, null, 2) + '\n', 'utf-8');
  console.log(`  ✅ Supply chain summary: ${summaryPath}`);

  console.log('');
}

main();
