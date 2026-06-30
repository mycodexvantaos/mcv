/**
 * Release Artifact Manifest Tests
 */

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

import {
  scanServices,
  computeManifestHash,
  generateManifest,
  type ReleaseManifest,
  type ServiceEntry,
} from "../generate-release-manifest.ts";

describe("Release Artifact Manifest", () => {
  // ──── scanServices ─────────────────────────────────────────────────────

  describe("scanServices", () => {
    it("should return an array of services with name and version", () => {
      const services = scanServices();
      assert.ok(Array.isArray(services));
      assert.ok(services.length > 0, "Should find at least one service or package");

      for (const svc of services) {
        assert.ok(svc.name, "Each service must have a name");
        assert.ok(svc.version, "Each service must have a version");
        assert.match(svc.version, /^\d+\.\d+\.\d+/, "Version should be semver-like");
      }
    });

    it("should include known workspace packages", () => {
      const services = scanServices();
      const names = services.map((s) => s.name);
      assert.ok(
        names.some((n) => n.includes("mycodexvantaos")),
        "Should include mycodexvantaos packages"
      );
    });

    it("should return services sorted by name", () => {
      const services = scanServices();
      for (let i = 1; i < services.length; i++) {
        assert.ok(
          services[i].name >= services[i - 1].name,
          `Services should be sorted: ${services[i - 1].name} <= ${services[i].name}`
        );
      }
    });
  });

  // ──── computeManifestHash ──────────────────────────────────────────────

  describe("computeManifestHash", () => {
    it("should produce a SHA-256 hash (64 hex characters)", () => {
      const manifest = {
        version: "0.1.0",
        commit: "abc123",
        branch: "main",
        buildTimestamp: "2024-01-01T00:00:00.000Z",
        runtime: { nodeVersion: "v22.0.0", platform: "linux", arch: "x64" },
        services: [],
        governance: {
          auditEnforcement: true,
          knowledgeTraceEnforcement: true,
          dreamSafetyEnforcement: true,
        },
      };

      const hash = computeManifestHash(manifest);
      assert.equal(hash.length, 64, "SHA-256 hash should be 64 hex characters");
      assert.match(hash, /^[0-9a-f]+$/, "Hash should be hex-encoded");
    });

    it("should produce deterministic hashes for identical manifests", () => {
      const manifest = {
        version: "1.0.0",
        commit: "def456",
        branch: "release",
        buildTimestamp: "2024-06-15T12:00:00.000Z",
        runtime: { nodeVersion: "v22.0.0", platform: "darwin", arch: "arm64" },
        services: [{ name: "@mycodexvantaos/test", version: "1.0.0" }],
        governance: {
          auditEnforcement: true,
          knowledgeTraceEnforcement: false,
          dreamSafetyEnforcement: true,
        },
      };

      const hash1 = computeManifestHash(manifest);
      const hash2 = computeManifestHash(manifest);
      assert.equal(hash1, hash2, "Same manifest should produce same hash");
    });

    it("should produce different hashes for different manifests", () => {
      const manifest1 = {
        version: "1.0.0",
        commit: "aaa111",
        branch: "main",
        buildTimestamp: "2024-01-01T00:00:00.000Z",
        runtime: { nodeVersion: "v22.0.0", platform: "linux", arch: "x64" },
        services: [],
        governance: {
          auditEnforcement: true,
          knowledgeTraceEnforcement: true,
          dreamSafetyEnforcement: true,
        },
      };

      const manifest2 = { ...manifest1, version: "2.0.0" };

      const hash1 = computeManifestHash(manifest1);
      const hash2 = computeManifestHash(manifest2);
      assert.notEqual(hash1, hash2, "Different versions should produce different hashes");
    });
  });

  // ──── generateManifest ─────────────────────────────────────────────────

  describe("generateManifest", () => {
    it("should generate a valid release manifest", () => {
      const manifest = generateManifest();

      assert.ok(manifest.version, "Manifest must have a version");
      assert.ok(manifest.commit, "Manifest must have a commit");
      assert.ok(manifest.branch, "Manifest must have a branch");
      assert.ok(manifest.buildTimestamp, "Manifest must have a buildTimestamp");
      assert.ok(manifest.runtime, "Manifest must have runtime info");
      assert.ok(manifest.services, "Manifest must have services array");
      assert.ok(manifest.governance, "Manifest must have governance info");
      assert.ok(manifest.manifestHash, "Manifest must have manifestHash");
    });

    it("should have runtime with nodeVersion, platform, and arch", () => {
      const manifest = generateManifest();

      assert.ok(manifest.runtime.nodeVersion, "Runtime must have nodeVersion");
      assert.ok(manifest.runtime.platform, "Runtime must have platform");
      assert.ok(manifest.runtime.arch, "Runtime must have arch");
      assert.equal(manifest.runtime.nodeVersion, process.version);
      assert.equal(manifest.runtime.platform, process.platform);
      assert.equal(manifest.runtime.arch, process.arch);
    });

    it("should have governance enforcement flags", () => {
      const manifest = generateManifest();

      assert.equal(typeof manifest.governance.auditEnforcement, "boolean");
      assert.equal(typeof manifest.governance.knowledgeTraceEnforcement, "boolean");
      assert.equal(typeof manifest.governance.dreamSafetyEnforcement, "boolean");
    });

    it("should have a valid SHA-256 manifestHash", () => {
      const manifest = generateManifest();

      assert.equal(manifest.manifestHash.length, 64, "manifestHash should be SHA-256");
      assert.match(manifest.manifestHash, /^[0-9a-f]+$/, "manifestHash should be hex-encoded");
    });

    it("should produce manifestHash that matches recomputation", () => {
      const manifest = generateManifest();

      // Recompute hash from manifest data (excluding manifestHash itself)
      const { manifestHash: _, ...dataWithoutHash } = manifest;
      const recomputedHash = computeManifestHash(dataWithoutHash);

      assert.equal(manifest.manifestHash, recomputedHash, "manifestHash should be verifiable");
    });

    it("should include services with name and version", () => {
      const manifest = generateManifest();

      assert.ok(Array.isArray(manifest.services));
      if (manifest.services.length > 0) {
        for (const svc of manifest.services) {
          assert.ok(svc.name, "Service must have a name");
          assert.ok(svc.version, "Service must have a version");
        }
      }
    });

    it("should have buildTimestamp in ISO 8601 format", () => {
      const manifest = generateManifest();

      // Should be parseable as a date
      const parsed = new Date(manifest.buildTimestamp);
      assert.ok(!isNaN(parsed.getTime()), "buildTimestamp should be a valid date");
    });
  });
});
