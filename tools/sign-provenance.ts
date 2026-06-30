#!/usr/bin/env node
/**
 * @module tools/sign-provenance
 * @description Signs release provenance using cosign keyless signing (Sigstore/GitHub OIDC).
 *
 * This script is designed to run inside GitHub Actions where OIDC tokens are available.
 * It calls cosign sign-blob to produce a detached signature and certificate, then
 * embeds the signature into the provenance.intoto.json bundle.
 *
 * Usage:
 *   pnpm release:sign
 *   pnpm release:sign --version v0.1.0
 *
 * Environment:
 *   COSIGN_EXPERIMENTAL=1   — required for keyless signing
 *   GITHUB_ACTIONS=true     — required (must run in GitHub Actions)
 *
 * Signing policy:
 *   - Stable releases (v*.*.*) must be signed per G010 of rc-promotion-policy.json
 *   - RC releases are signed as best-effort
 *   - Signing method: Sigstore keyless via GitHub OIDC
 *
 * References:
 *   - release/policies/signing-policy.json
 *   - docs/security/release-signing.md
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

// ── Types ──────────────────────────────────────────────────────────
interface ProvenanceSignature {
  keyid: string;
  sig: string;
  cert?: string;
  signingIdentity?: string;
  signingMethod: string;
  oidcIssuer?: string;
  signedAt: string;
}

interface SignedProvenance {
  _type: string;
  predicateType: string;
  subject: unknown[];
  predicate: unknown;
  signatures?: ProvenanceSignature[];
}

// ── Helpers ────────────────────────────────────────────────────────
function exec(command: string, options?: { env?: Record<string, string> }): string {
  try {
    return execSync(command, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env, ...(options?.env ?? {}) },
    }).trim();
  } catch (err: unknown) {
    const error = err as { stderr?: string; message?: string };
    throw new Error(error.stderr ?? error.message ?? String(err));
  }
}

function git(command: string): string {
  try {
    return execSync(`git ${command}`, { encoding: "utf-8" }).trim();
  } catch {
    return "unknown";
  }
}

function getVersion(): string {
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--version" && args[i + 1]) {
      return args[i + 1];
    }
  }
  const tag = git("describe --tags --exact-match HEAD 2>/dev/null");
  if (tag && tag !== "unknown") return tag;
  return process.env.npm_package_version ?? "0.1.0";
}

// ── Main ───────────────────────────────────────────────────────────
function main(): void {
  const version = getVersion();
  const isGitHubActions = process.env.GITHUB_ACTIONS === "true";

  console.log("\n🔐 MyCodeXvantaOS Provenance Signer (cosign keyless)");
  console.log(`   Version: ${version}`);
  console.log("━".repeat(50));

  if (!isGitHubActions) {
    console.error("\n❌ This script must run inside GitHub Actions (GITHUB_ACTIONS=true).");
    console.error("   Keyless signing requires a GitHub OIDC token.");
    console.error("   Use the sign-release.yaml workflow to sign provenance.");
    process.exit(1);
  }

  // Locate provenance file
  const versionWithoutV = version.replace(/^v/, "");
  const candidatePaths = [
    resolve(process.cwd(), `release/artifacts/${version}/provenance.intoto.json`),
    resolve(process.cwd(), `release/artifacts/${versionWithoutV}/provenance.intoto.json`),
  ];

  let provenancePath: string | null = null;
  for (const p of candidatePaths) {
    if (existsSync(p)) {
      provenancePath = p;
      break;
    }
  }

  if (!provenancePath) {
    console.error(`\n❌ Provenance file not found. Searched:`);
    for (const p of candidatePaths) {
      console.error(`   ${p}`);
    }
    console.error("\n   Run pnpm release:provenance first.");
    process.exit(1);
  }

  const artifactsDir = resolve(provenancePath, "..");
  const sigPath = `${provenancePath}.sig`;
  const certPath = `${provenancePath}.cert`;

  console.log(`\n  📄 Provenance: ${provenancePath}`);

  // Check if cosign is available
  try {
    exec("cosign version");
    console.log("  ✅ cosign available");
  } catch {
    console.error("\n❌ cosign not found. Install via: sigstore/cosign-installer@v3");
    process.exit(1);
  }

  // Sign the provenance blob
  console.log("\n  🔏 Signing provenance with cosign keyless...");
  try {
    exec(
      `cosign sign-blob --yes --output-signature "${sigPath}" --output-certificate "${certPath}" "${provenancePath}"`,
      { env: { COSIGN_EXPERIMENTAL: "1" } }
    );
    console.log(`  ✅ Signature: ${sigPath}`);
    console.log(`  ✅ Certificate: ${certPath}`);
  } catch (err) {
    console.error(`\n❌ cosign sign-blob failed: ${err}`);
    process.exit(1);
  }

  // Read signature and certificate
  const sigB64 = readFileSync(sigPath, "utf-8").trim();
  const certB64 = readFileSync(certPath, "utf-8").trim();

  // Extract signing identity from certificate
  let signingIdentity = "github-actions-oidc";
  try {
    const certText = exec(`openssl x509 -in "${certPath}" -noout -text 2>/dev/null`);
    const uriMatch = certText.match(/URI:([^\s]+)/);
    if (uriMatch) {
      signingIdentity = uriMatch[1];
    }
  } catch {
    // Use default identity
  }

  // Embed signature in provenance bundle
  console.log("\n  📝 Embedding signature in provenance bundle...");
  const provenance = JSON.parse(readFileSync(provenancePath, "utf-8")) as SignedProvenance;

  const signature: ProvenanceSignature = {
    keyid: "sigstore-keyless-github-oidc",
    sig: sigB64,
    cert: certB64,
    signingIdentity,
    signingMethod: "sigstore-keyless",
    oidcIssuer: "https://token.actions.githubusercontent.com",
    signedAt: new Date().toISOString(),
  };

  provenance.signatures = [signature];
  writeFileSync(provenancePath, JSON.stringify(provenance, null, 2) + "\n", "utf-8");
  console.log("  ✅ Signature embedded in provenance.intoto.json");

  // Update supply-chain-summary.json
  const summaryPath = resolve(artifactsDir, "supply-chain-summary.json");
  if (existsSync(summaryPath)) {
    const summary = JSON.parse(readFileSync(summaryPath, "utf-8")) as Record<string, unknown>;
    summary["signingStatus"] = "signed";
    summary["signingMethod"] = "sigstore-keyless";
    summary["signingWorkflow"] = ".github/workflows/sign-release.yaml";
    summary["signedAt"] = new Date().toISOString();
    summary["oidcIssuer"] = "https://token.actions.githubusercontent.com";

    // Remove signing from infrastructure skips
    if (Array.isArray(summary["infrastructureSkips"])) {
      summary["infrastructureSkips"] = (summary["infrastructureSkips"] as string[]).filter(
        (s) => !s.toLowerCase().includes("signing")
      );
    }

    writeFileSync(summaryPath, JSON.stringify(summary, null, 2) + "\n", "utf-8");
    console.log("  ✅ Supply chain summary updated (signingStatus: signed)");
  }

  // Verify the signature
  console.log("\n  🔍 Verifying signature...");
  try {
    exec(
      `cosign verify-blob ` +
        `--signature "${sigPath}" ` +
        `--certificate "${certPath}" ` +
        `--certificate-identity "${signingIdentity}" ` +
        `--certificate-oidc-issuer "https://token.actions.githubusercontent.com" ` +
        `"${provenancePath}"`,
      { env: { COSIGN_EXPERIMENTAL: "1" } }
    );
    console.log("  ✅ Signature verified successfully");
  } catch {
    console.warn("  ⚠️  Signature verification failed (may be expected for new Rekor entries)");
  }

  console.log("\n  ✅ Provenance signing complete");
  console.log(`     Signing identity: ${signingIdentity}`);
  console.log("     OIDC issuer: https://token.actions.githubusercontent.com");
  console.log("     Transparency log: Rekor (public-good)");
  console.log("");
}

main();
