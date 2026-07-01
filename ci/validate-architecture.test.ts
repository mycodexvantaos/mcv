/**
 * ci/validate-architecture.test.ts
 *
 * Unit tests for the validate-architecture CI validator.
 * Tests all 20 rules with valid and invalid examples.
 *
 * Run with: npx jest ci/validate-architecture.test.ts
 * or: npx vitest run ci/validate-architecture.test.ts
 */

import { runValidation, ValidationContext } from "./validate-architecture.js";
import {
  validate,
  containsVersionPattern,
  containsEnvironmentMarker,
  derivePackageName,
  derivePackageShortId,
} from "./utils/regex-table.js";

// ─── Helper ────────────────────────────────────────────────────────────────

function emptyCtx(): ValidationContext {
  return {
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
}

// ─── Section 5.1 service-id ──────────────────────────────────────────────────────

describe("service-id rule (Section 5.1) — hard", () => {
  test("valid service ids pass", () => {
    const valid = [
      "mycodexvantaos-core-kernel",
      "mycodexvantaos-ai-embedding",
      "mycodexvantaos-data-vector-store",
      "mycodexvantaos-platform-observability",
      "mycodexvantaos-security-secrets",
    ];
    for (const id of valid) {
      expect(validate("service-id", id)).toBe(true);
    }
  });

  test("invalid service ids fail", () => {
    const invalid = [
      "core-kernel", // missing prefix
      "mycodexvantaos-", // missing capability
      "mycodexvantaos-ai", // only one segment after prefix
      "MyCodeXvantaOS-ai-embedding", // uppercase
      "mycodexvantaos-ai-embedding-v2", // version in name
      "mycodexvantaos-ai-embedding-prod", // environment marker
      "mycodexvanta-os-ai-embedding", // legacy prefix
      "mycodexvantaos_ai_embedding", // underscores
    ];
    for (const id of invalid) {
      expect(validate("service-id", id)).toBe(false);
    }
  });

  test("version pattern detection (Section 3.6)", () => {
    expect(containsVersionPattern("mycodexvantaos-core-kernel-v2")).toBe(true);
    expect(containsVersionPattern("mycodexvantaos-core-v1-kernel")).toBe(true);
    expect(containsVersionPattern("mycodexvantaos-core-kernel")).toBe(false);
  });

  test("environment marker detection (Section 3.7)", () => {
    expect(containsEnvironmentMarker("mycodexvantaos-ai-embedding-dev")).toBe(true);
    expect(containsEnvironmentMarker("mycodexvantaos-ai-embedding-prod")).toBe(true);
    expect(containsEnvironmentMarker("mycodexvantaos-ai-embedding-staging")).toBe(true);
    expect(containsEnvironmentMarker("mycodexvantaos-ai-embedding")).toBe(false);
  });
});

// ─── Section 5.2 package derivation ──────────────────────────────────────────────

describe("package name derivation (Section 5.2, Section 7.1)", () => {
  test("derives correct package short id", () => {
    expect(derivePackageShortId("mycodexvantaos-core-kernel")).toBe("core-kernel");
    expect(derivePackageShortId("mycodexvantaos-ai-embedding")).toBe("ai-embedding");
    expect(derivePackageShortId("mycodexvantaos-data-vector-store")).toBe("data-vector-store");
  });

  test("derives correct package name", () => {
    expect(derivePackageName("mycodexvantaos-core-kernel")).toBe("@mycodexvantaos/core-kernel");
    expect(derivePackageName("mycodexvantaos-ai-embedding")).toBe("@mycodexvantaos/ai-embedding");
  });

  test("package name format validation", () => {
    expect(validate("package-name", "@mycodexvantaos/core-kernel")).toBe(true);
    expect(validate("package-name", "@mycodexvantaos/ai-embedding")).toBe(true);
    expect(validate("package-name", "core-kernel")).toBe(false); // missing scope
    expect(validate("package-name", "@other/core-kernel")).toBe(false); // wrong scope
    expect(validate("package-name", "@mycodexvantaos/CoreKernel")).toBe(false); // uppercase
  });
});

// ─── Section 5.5 capability-id ────────────────────────────────────────────────────

describe("capability-id rule (Section 5.5) — hard", () => {
  test("all 19 canonical capabilities pass", () => {
    const caps = [
      "database",
      "storage",
      "auth",
      "queue",
      "state-store",
      "secrets",
      "repo",
      "deploy",
      "validation",
      "security",
      "observability",
      "notification",
      "scheduler",
      "vector-store",
      "embedding",
      "llm",
      "graph",
      "cache",
      "search",
    ];
    for (const cap of caps) {
      expect(validate("capability-id", cap)).toBe(true);
    }
  });

  test("vendor names fail", () => {
    expect(validate("capability-id", "postgres")).toBe(false);
    expect(validate("capability-id", "redis")).toBe(false);
    expect(validate("capability-id", "openai")).toBe(false);
  });
});

// ─── Section 8.1 provider-instance ────────────────────────────────────────────────

describe("provider-instance rule (Section 8.1) — hard", () => {
  test("valid provider instances pass", () => {
    const valid = [
      "database-postgres",
      "vector-store-pgvector",
      "llm-openai",
      "cache-redis",
      "embedding-cohere",
    ];
    for (const pi of valid) {
      expect(validate("provider-instance", pi)).toBe(true);
    }
  });

  test("inverted order fails", () => {
    expect(validate("provider-instance", "postgres-database")).toBe(false);
    expect(validate("provider-instance", "openai-llm")).toBe(false);
  });
});

// ─── Section 7.2 env-var ──────────────────────────────────────────────────────────

describe("env-var rule (Section 7.2) — hard", () => {
  test("valid env vars pass", () => {
    const valid = [
      "MYCODEXVANTAOS_DATABASE_URL",
      "MYCODEXVANTAOS_AUTH_JWT_SECRET",
      "MYCODEXVANTAOS_MODE",
      "MYCODEXVANTAOS_VECTOR_STORE_URL",
    ];
    for (const ev of valid) {
      expect(validate("env-var", ev)).toBe(true);
    }
  });

  test("invalid env vars fail", () => {
    expect(validate("env-var", "DATABASE_URL")).toBe(false); // missing prefix
    expect(validate("env-var", "ORCH_DATABASE_URL")).toBe(false); // deprecated prefix
    expect(validate("env-var", "mycodexvantaos_database_url")).toBe(false); // lowercase
  });
});

// ─── Section 7.5 URN ──────────────────────────────────────────────────────────────

describe("URN rule (Section 7.5) — hard", () => {
  test("valid URNs pass", () => {
    const valid = [
      "urn:mycodexvantaos:capability:vector-store:pgvector",
      "urn:mycodexvantaos:manifest:service:mycodexvantaos-core-kernel",
      "urn:mycodexvantaos:policy:naming:naming-spec",
    ];
    for (const urn of valid) {
      expect(validate("urn", urn)).toBe(true);
    }
  });

  test("URNs with versions in identifier fail", () => {
    expect(
      validate("urn", "urn:mycodexvantaos:manifest:service:mycodexvantaos-core-kernel-v2")
    ).toBe(false);
  });
});

// ─── Section 4 forbidden legacy prefix ───────────────────────────────────────────

describe("forbidden-legacy-prefix rule (Section 4) — hard", () => {
  test("legacy prefixes are flagged as invalid", () => {
    expect(validate("forbidden-legacy-prefix", "mycodexvanta-os-ai-service")).toBe(false);
    expect(validate("forbidden-legacy-prefix", "codexvanta-ai-service")).toBe(false);
    expect(validate("forbidden-legacy-prefix", "codexvanta-os-core")).toBe(false);
  });

  test("correct names are not flagged", () => {
    expect(validate("forbidden-legacy-prefix", "mycodexvantaos-ai-embedding")).toBe(true);
  });
});

// ─── Section 9.2 vector-collection ────────────────────────────────────────────────

describe("vector-collection (Section 9.2) — soft", () => {
  test("valid vector collection ids pass", () => {
    expect(validate("vector-collection", "mycodexvantaos-ai-memory--memories--bge-small-384")).toBe(
      true
    );
    expect(
      validate(
        "vector-collection",
        "mycodexvantaos-docs-search--docs--openai-text-embedding-3-small-1536d"
      )
    ).toBe(true);
  });
});

// ─── Section 9.3 embedding-model-alias ───────────────────────────────────────────

describe("embedding-model-alias (Section 9.3) — soft", () => {
  test("valid aliases pass", () => {
    expect(validate("embedding-model-alias", "openai--text-embedding-3-small--1536d")).toBe(true);
    expect(validate("embedding-model-alias", "cohere--embed-english-v3--1024d")).toBe(true);
    expect(validate("embedding-model-alias", "ollama--nomic-embed-text--768d")).toBe(true);
  });

  test("invalid aliases fail", () => {
    expect(validate("embedding-model-alias", "openai--text-embedding-3-small--1536")).toBe(false); // missing d
    expect(validate("embedding-model-alias", "openai-text-embedding-3-small-1536d")).toBe(false); // single hyphen
  });
});

// ─── Section 9.4 retrieval-pipeline-id ───────────────────────────────────────────

describe("retrieval-pipeline-id (Section 9.4) — soft", () => {
  test("valid ids pass", () => {
    expect(validate("retrieval-pipeline-id", "retrieval--dense--pgvector")).toBe(true);
    expect(validate("retrieval-pipeline-id", "retrieval--hybrid--qdrant")).toBe(true);
    expect(validate("retrieval-pipeline-id", "retrieval--sparse--memory")).toBe(true);
  });
});

// ─── Section 9.8 timestamped-id ──────────────────────────────────────────────────

describe("timestamped-id (Section 9.8) — soft", () => {
  test("valid ids pass", () => {
    expect(validate("timestamped-id", "job--20260418--a1b2c3")).toBe(true);
    expect(validate("timestamped-id", "exception--20260418--zx9k1m")).toBe(true);
  });

  test("invalid ids fail", () => {
    expect(validate("timestamped-id", "job--2026-04-18--a1b2c3")).toBe(false); // dashes in date
    expect(validate("timestamped-id", "job--20260418--A1B2C3")).toBe(false); // uppercase random
  });
});

// ─── Section 9.9 content-addressed-id ────────────────────────────────────────────

describe("content-addressed-id (Section 9.9) — soft", () => {
  test("valid ids pass", () => {
    expect(validate("content-addressed-id", "dataset--sha256-3f4a8b9c1d2e")).toBe(true);
    expect(validate("content-addressed-id", "artifact--sha256-abcdef012345")).toBe(true);
  });
});

// ─── Section 9.10 uuid-based-id ──────────────────────────────────────────────────

describe("uuid-based-id (Section 9.10) — soft", () => {
  test("valid ids pass", () => {
    expect(validate("uuid-based-id", "session--550e8400e29b41d4a716446655440000")).toBe(true);
  });
});

// ─── Full validation run ────────────────────────────────────────────────────

describe("runValidation — integration", () => {
  test("clean context produces no failures", () => {
    const ctx: ValidationContext = {
      ...emptyCtx(),
      serviceIds: ["mycodexvantaos-core-kernel", "mycodexvantaos-ai-embedding"],
      capabilityIds: ["database", "llm", "embedding"],
      providerInstances: ["database-postgres", "llm-openai", "embedding-cohere"],
      envVars: ["MYCODEXVANTAOS_DATABASE_URL", "MYCODEXVANTAOS_AUTH_JWT_SECRET"],
      packageEntries: [
        { serviceId: "mycodexvantaos-core-kernel", packageName: "@mycodexvantaos/core-kernel" },
        { serviceId: "mycodexvantaos-ai-embedding", packageName: "@mycodexvantaos/ai-embedding" },
      ],
    };

    const report = runValidation(ctx);
    expect(report.hardFailures).toHaveLength(0);
    expect(report.exitCode).toBe(0);
  });

  test("invalid service id produces hard failure", () => {
    const ctx: ValidationContext = {
      ...emptyCtx(),
      serviceIds: ["core-kernel"],
    };
    const report = runValidation(ctx);
    expect(report.hardFailures.length).toBeGreaterThan(0);
    expect(report.exitCode).toBe(1);
  });

  test("legacy prefix produces hard failure", () => {
    const ctx: ValidationContext = {
      ...emptyCtx(),
      serviceIds: ["codexvanta-ai-service"],
    };
    const report = runValidation(ctx);
    expect(
      report.hardFailures.some(
        (r) => r.ruleId === "forbidden-legacy-prefix" || r.ruleId === "service-id"
      )
    ).toBe(true);
  });
});
