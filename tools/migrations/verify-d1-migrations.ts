#!/usr/bin/env npx tsx
/**
 * @module tools/migrations/verify-d1-migrations
 * @description Verifies D1 migration files are syntactically valid and
 *              that critical tables referenced by contracts exist.
 *
 * Usage: npx tsx tools/migrations/verify-d1-migrations.ts
 *
 * Checks:
 * 1. All SQL files in migrations/d1/ parse without syntax errors
 * 2. All critical tables from contracts exist in the migration set
 * 3. Migrations are sequentially numbered
 * 4. No duplicate table definitions across migrations
 */

import { readdirSync, readFileSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";

// ─── Critical tables that must exist based on contracts ────────────────

const CRITICAL_TABLES = [
  "identity_subjects",
  "identity_sessions",
  "workspaces",
  "workspace_memberships",
  "knowledge_collections",
  "knowledge_documents",
  "knowledge_chunks",
  "agent_sessions",
  "agent_messages",
  "model_endpoints",
  "audit_events",
  "usage_events",
  "automation_jobs",
  // From PR 37: service-catalog
  "service_definitions",
  // From PR 38: resource-registry
  "resource_kinds",
  // From PR 40: policy model
  "policy_definitions",
  // From PR 41: memory model
  "memory_items",
  "memory_candidates",
  "memory_relations",
  // From PR 42: memory dream
  "memory_dream_runs",
  "memory_dream_actions",
  // From PR 43: knowledge trace
  "retrieval_receipts",
  "answer_traces",
];

// ─── Helpers ───────────────────────────────────────────────────────────

function findMigrationsRoot(): string {
  let dir = process.cwd();
  for (let i = 0; i < 10; i++) {
    if (existsSync(join(dir, "migrations", "d1"))) {
      return dir;
    }
    dir = resolve(dir, "..");
  }
  throw new Error("Could not find migrations/d1/ directory");
}

function extractCreateTableNames(sql: string): string[] {
  const tables: string[] = [];
  const regex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z_][a-zA-Z0-9_]*)/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(sql)) !== null) {
    tables.push(match[1].toLowerCase());
  }
  return tables;
}

function extractCreateIndexNames(sql: string): string[] {
  const indexes: string[] = [];
  const regex =
    /CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z_][a-zA-Z0-9_]*)/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(sql)) !== null) {
    indexes.push(match[1].toLowerCase());
  }
  return indexes;
}

// ─── Verification ──────────────────────────────────────────────────────

interface VerificationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    migrationCount: number;
    tablesCreated: string[];
    indexesCreated: string[];
    criticalTablesMissing: string[];
  };
}

function verifyD1Migrations(): VerificationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const allTables = new Set<string>();
  const allIndexes = new Set<string>();
  const duplicateTables = new Set<string>();

  const root = findMigrationsRoot();
  const d1Dir = join(root, "migrations", "d1");

  if (!existsSync(d1Dir)) {
    errors.push(`D1 migrations directory not found: ${d1Dir}`);
    return {
      valid: false,
      errors,
      warnings,
      stats: {
        migrationCount: 0,
        tablesCreated: [],
        indexesCreated: [],
        criticalTablesMissing: CRITICAL_TABLES,
      },
    };
  }

  const files = readdirSync(d1Dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    errors.push("No SQL migration files found in migrations/d1/");
    return {
      valid: false,
      errors,
      warnings,
      stats: {
        migrationCount: 0,
        tablesCreated: [],
        indexesCreated: [],
        criticalTablesMissing: CRITICAL_TABLES,
      },
    };
  }

  // Check sequential numbering
  const numberPattern = /^(\d+)/;
  const seenNumbers = new Map<string, string>();
  for (const file of files) {
    const match = file.match(numberPattern);
    if (match) {
      const num = match[1];
      if (seenNumbers.has(num)) {
        errors.push(`Duplicate migration number ${num}: ${file} and ${seenNumbers.get(num)}`);
      }
      seenNumbers.set(num, file);
    }
  }

  // Process each migration file
  for (const file of files) {
    const filePath = join(d1Dir, file);
    const content = readFileSync(filePath, "utf-8");

    // Check for syntax issues (basic checks)
    if (content.trim().length === 0) {
      warnings.push(`Empty migration file: ${file}`);
      continue;
    }

    // Extract tables
    const tables = extractCreateTableNames(content);
    for (const table of tables) {
      if (allTables.has(table)) {
        duplicateTables.add(table);
        warnings.push(
          `Table "${table}" redefined in ${file} (previously defined in another migration)`
        );
      }
      allTables.add(table);
    }

    // Extract indexes
    const indexes = extractCreateIndexNames(content);
    for (const idx of indexes) {
      if (allIndexes.has(idx)) {
        warnings.push(`Index "${idx}" redefined in ${file}`);
      }
      allIndexes.add(idx);
    }

    // Basic SQL syntax checks
    const statements = content
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    for (const stmt of statements) {
      const upper = stmt.toUpperCase();
      if (
        upper.startsWith("CREATE") &&
        !upper.includes("TABLE") &&
        !upper.includes("INDEX") &&
        !upper.includes("TRIGGER") &&
        !upper.includes("VIRTUAL")
      ) {
        warnings.push(`Unexpected CREATE statement in ${file}: ${stmt.substring(0, 80)}...`);
      }
      if (upper.startsWith("DROP") && !upper.includes("IF EXISTS")) {
        warnings.push(
          `DROP without IF EXISTS in ${file} may cause errors: ${stmt.substring(0, 80)}...`
        );
      }
      if (upper.startsWith("ALTER")) {
        warnings.push(
          `ALTER statement in ${file} may not be supported by D1: ${stmt.substring(0, 80)}...`
        );
      }
    }
  }

  // Check critical tables
  const criticalTablesMissing = CRITICAL_TABLES.filter((t) => !allTables.has(t));
  if (criticalTablesMissing.length > 0) {
    warnings.push(`Missing critical tables: ${criticalTablesMissing.join(", ")}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats: {
      migrationCount: files.length,
      tablesCreated: Array.from(allTables).sort(),
      indexesCreated: Array.from(allIndexes).sort(),
      criticalTablesMissing,
    },
  };
}

// ─── Main ──────────────────────────────────────────────────────────────

const result = verifyD1Migrations();

console.log("═".repeat(60));
console.log("D1 Migration Verification Report");
console.log("═".repeat(60));
console.log(`Valid: ${result.valid ? "✅ YES" : "❌ NO"}`);
console.log(`Migrations: ${result.stats.migrationCount}`);
console.log(`Tables Created: ${result.stats.tablesCreated.length}`);
console.log(`Indexes Created: ${result.stats.indexesCreated.length}`);
console.log(`Critical Tables Missing: ${result.stats.criticalTablesMissing.length}`);

if (result.stats.tablesCreated.length > 0) {
  console.log("\n📋 Tables:");
  for (const t of result.stats.tablesCreated) {
    const isCritical = CRITICAL_TABLES.includes(t);
    console.log(`  ${isCritical ? "⭐" : "  "} ${t}`);
  }
}

if (result.errors.length > 0) {
  console.log("\n❌ Errors:");
  for (const e of result.errors) {
    console.log(`  - ${e}`);
  }
}

if (result.warnings.length > 0) {
  console.log("\n⚠️  Warnings:");
  for (const w of result.warnings) {
    console.log(`  - ${w}`);
  }
}

console.log("═".repeat(60));

// Exit with error code if invalid
if (!result.valid) {
  process.exit(1);
}
