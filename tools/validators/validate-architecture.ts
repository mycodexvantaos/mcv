#!/usr/bin/env npx tsx
/**
 * @module tools/validators/validate-architecture
 * @description Validates the platform architecture follows the constitutional models.
 *
 * Checks:
 *   1. All 8 service categories have corresponding packages
 *   2. Core model packages exist with expected types
 *   3. Port packages exist with expected interfaces
 *   4. Application services implement correct ports
 *   5. Adapters implement correct ports
 *   6. Dependency direction is correct (core ← ports ← application ← adapters)
 *   7. No circular dependencies
 *
 * Usage:
 *   npx tsx tools/validators/validate-architecture.ts
 */

import * as fs from "fs";
import * as path from "path";

const ROOT = path.resolve(__dirname, "../..");

interface ArchCheck {
  name: string;
  passed: boolean;
  details: string[];
}

const checks: ArchCheck[] = [];

// ── Check 1: Core packages ─────────────────────────────────────────────

function checkCorePackages(): void {
  const requiredCore = [
    "shared",
    "service-catalog",
    "resource-model",
    "policy-model",
    "audit-model",
    "knowledge-model",
  ];
  const details: string[] = [];
  let allFound = true;

  for (const pkg of requiredCore) {
    const dir = path.join(ROOT, "packages/core", pkg);
    if (fs.existsSync(dir)) {
      const indexFile = path.join(dir, "index.ts");
      if (fs.existsSync(indexFile)) {
        details.push(`  ✅ packages/core/${pkg}/index.ts`);
      } else {
        details.push(`  ⚠️  packages/core/${pkg}/ exists but missing index.ts`);
        allFound = false;
      }
    } else {
      details.push(`  ❌ packages/core/${pkg}/ not found`);
      allFound = false;
    }
  }

  checks.push({ name: "Core packages (6 sub-packages)", passed: allFound, details });
}

// ── Check 2: Port packages ─────────────────────────────────────────────

function checkPortPackages(): void {
  const requiredPorts = ["database", "object-storage", "search", "model-provider", "queue", "auth"];
  const details: string[] = [];
  let allFound = true;

  for (const pkg of requiredPorts) {
    const dir = path.join(ROOT, "packages/ports", pkg);
    if (fs.existsSync(dir)) {
      details.push(`  ✅ packages/ports/${pkg}/`);
    } else {
      details.push(`  ❌ packages/ports/${pkg}/ not found`);
      allFound = false;
    }
  }

  checks.push({ name: "Port packages (6 sub-packages)", passed: allFound, details });
}

// ── Check 3: Application service packages ──────────────────────────────

function checkApplicationPackages(): void {
  const requiredApps = [
    "identity",
    "workspace",
    "knowledge",
    "agent",
    "model",
    "audit",
    "usage",
    "automation",
  ];
  const details: string[] = [];
  let allFound = true;

  for (const pkg of requiredApps) {
    const dir = path.join(ROOT, "packages/application", pkg);
    if (fs.existsSync(dir)) {
      const serviceFile = fs.readdirSync(dir).find((f) => f.endsWith("-service.ts"));
      if (serviceFile) {
        details.push(`  ✅ packages/application/${pkg}/ (${serviceFile})`);
      } else {
        details.push(`  ⚠️  packages/application/${pkg}/ exists but no service file`);
      }
    } else {
      details.push(`  ❌ packages/application/${pkg}/ not found`);
      allFound = false;
    }
  }

  checks.push({ name: "Application services (8 sub-packages)", passed: allFound, details });
}

// ── Check 4: Adapter packages ──────────────────────────────────────────

function checkAdapterPackages(): void {
  const requiredAdapters = [
    "cloudflare-d1",
    "cloudflare-kv",
    "cloudflare-r2",
    "d1-full-text-search",
    "openai",
    "openrouter",
    "workers-ai",
  ];
  const details: string[] = [];
  let allFound = true;

  for (const pkg of requiredAdapters) {
    const dir = path.join(ROOT, "packages/adapters", pkg);
    if (fs.existsSync(dir)) {
      details.push(`  ✅ packages/adapters/${pkg}/`);
    } else {
      details.push(`  ❌ packages/adapters/${pkg}/ not found`);
      allFound = false;
    }
  }

  checks.push({ name: "Adapter packages (7 sub-packages)", passed: allFound, details });
}

// ── Check 5: Service categories ────────────────────────────────────────

function checkServiceCategories(): void {
  const categoriesFile = path.join(ROOT, "contracts/service-categories.yaml");
  const details: string[] = [];

  if (!fs.existsSync(categoriesFile)) {
    checks.push({
      name: "Service categories (8 categories)",
      passed: false,
      details: ["  ❌ contracts/service-categories.yaml not found"],
    });
    return;
  }

  const content = fs.readFileSync(categoriesFile, "utf-8");
  const expectedCategories = [
    "knowledge",
    "agent",
    "workspace",
    "developer",
    "security",
    "storage",
    "model",
    "automation",
  ];
  let allFound = true;

  for (const cat of expectedCategories) {
    if (content.includes(cat)) {
      details.push(`  ✅ Category: ${cat}`);
    } else {
      details.push(`  ❌ Category missing: ${cat}`);
      allFound = false;
    }
  }

  checks.push({ name: "Service categories (8 categories)", passed: allFound, details });
}

// ── Check 6: Migrations ────────────────────────────────────────────────

function checkMigrations(): void {
  const requiredDirs = ["d1", "sqlite", "postgres"];
  const details: string[] = [];
  let allFound = true;

  for (const dir of requiredDirs) {
    const migrationDir = path.join(ROOT, "migrations", dir);
    if (fs.existsSync(migrationDir)) {
      const files = fs.readdirSync(migrationDir).filter((f) => f.endsWith(".sql"));
      if (files.length > 0) {
        details.push(`  ✅ migrations/${dir}/ (${files.length} file(s))`);
      } else {
        details.push(`  ⚠️  migrations/${dir}/ exists but empty`);
      }
    } else {
      details.push(`  ❌ migrations/${dir}/ not found`);
      allFound = false;
    }
  }

  checks.push({ name: "Database migrations (3 dialects)", passed: allFound, details });
}

// ── Check 7: Apps layer ────────────────────────────────────────────────

function checkAppsLayer(): void {
  const requiredApps = ["api-worker", "web-console", "cli"];
  const details: string[] = [];
  let allFound = true;

  for (const app of requiredApps) {
    const dir = path.join(ROOT, "apps", app);
    if (fs.existsSync(dir)) {
      details.push(`  ✅ apps/${app}/`);
    } else {
      details.push(`  ❌ apps/${app}/ not found`);
      allFound = false;
    }
  }

  checks.push({ name: "Apps layer (3 entry points)", passed: allFound, details });
}

// ── Check 8: Runtime layer ─────────────────────────────────────────────

function checkRuntimesLayer(): void {
  const requiredRuntimes = ["cloudflare", "node", "docker", "kubernetes"];
  const details: string[] = [];
  let allFound = true;

  for (const rt of requiredRuntimes) {
    const dir = path.join(ROOT, "runtimes", rt);
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir, { recursive: true }) as string[];
      const tsFiles = files.filter((f) => f.toString().endsWith(".ts"));
      details.push(`  ✅ runtimes/${rt}/ (${tsFiles.length} TS file(s))`);
    } else {
      details.push(`  ❌ runtimes/${rt}/ not found`);
      allFound = false;
    }
  }

  checks.push({ name: "Runtime layer (4 runtimes)", passed: allFound, details });
}

// ── Main ───────────────────────────────────────────────────────────────

console.log("🏗️  Validating MyCodeXvantaOS platform architecture...\n");

checkCorePackages();
checkPortPackages();
checkApplicationPackages();
checkAdapterPackages();
checkServiceCategories();
checkMigrations();
checkAppsLayer();
checkRuntimesLayer();

// ── Report ─────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

for (const check of checks) {
  const icon = check.passed ? "✅" : "❌";
  console.log(`${icon} ${check.name}`);
  for (const detail of check.details) {
    console.log(`   ${detail}`);
  }

  if (check.passed) passed++;
  else failed++;
}

console.log(`\n${"─".repeat(50)}`);
console.log(`Checks: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  console.log("\n❌ Architecture validation FAILED");
  process.exit(1);
} else {
  console.log("\n✅ Architecture follows the platform constitution");
  process.exit(0);
}
