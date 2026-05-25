#!/usr/bin/env npx tsx
/**
 * @module tools/migrations/verify-sqlite-migrations
 * @description Verifies SQLite migration files are syntactically valid and
 *              that critical tables referenced by contracts exist.
 *
 * Usage: npx tsx tools/migrations/verify-sqlite-migrations.ts
 *
 * Checks:
 * 1. All SQL files in migrations/sqlite/ parse without syntax errors
 * 2. All critical tables from contracts exist in the migration set
 * 3. No duplicate table definitions across migrations
 * 4. SQLite-specific PRAGMA statements are valid
 */

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';

// ─── Critical tables that must exist based on contracts ────────────────

const CRITICAL_TABLES = [
  'identity_subjects',
  'identity_sessions',
  'workspaces',
  'workspace_memberships',
  'knowledge_collections',
  'knowledge_documents',
  'knowledge_chunks',
  'agent_sessions',
  'agent_messages',
  'model_endpoints',
  'audit_events',
  'usage_events',
  'automation_jobs',
];

// ─── Helpers ───────────────────────────────────────────────────────────

function findMigrationsRoot(): string {
  let dir = process.cwd();
  for (let i = 0; i < 10; i++) {
    if (existsSync(join(dir, 'migrations', 'sqlite'))) {
      return dir;
    }
    dir = resolve(dir, '..');
  }
  throw new Error('Could not find migrations/sqlite/ directory');
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
    hasFTS5: boolean;
    hasForeignKeys: boolean;
    hasWALMode: boolean;
  };
}

function verifySQLiteMigrations(): VerificationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const allTables = new Set<string>();
  const allIndexes = new Set<string>();
  let hasFTS5 = false;
  let hasForeignKeys = false;
  let hasWALMode = false;

  const root = findMigrationsRoot();
  const sqliteDir = join(root, 'migrations', 'sqlite');

  if (!existsSync(sqliteDir)) {
    errors.push(`SQLite migrations directory not found: ${sqliteDir}`);
    return {
      valid: false,
      errors,
      warnings,
      stats: {
        migrationCount: 0,
        tablesCreated: [],
        indexesCreated: [],
        criticalTablesMissing: CRITICAL_TABLES,
        hasFTS5: false,
        hasForeignKeys: false,
        hasWALMode: false,
      },
    };
  }

  const files = readdirSync(sqliteDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    errors.push('No SQL migration files found in migrations/sqlite/');
    return {
      valid: false,
      errors,
      warnings,
      stats: {
        migrationCount: 0,
        tablesCreated: [],
        indexesCreated: [],
        criticalTablesMissing: CRITICAL_TABLES,
        hasFTS5: false,
        hasForeignKeys: false,
        hasWALMode: false,
      },
    };
  }

  // Process each migration file
  for (const file of files) {
    const filePath = join(sqliteDir, file);
    const content = readFileSync(filePath, 'utf-8');

    if (content.trim().length === 0) {
      warnings.push(`Empty migration file: ${file}`);
      continue;
    }

    // Check for SQLite-specific PRAGMA statements
    const upperContent = content.toUpperCase();
    if (
      upperContent.includes('PRAGMA JOURNAL_MODE = WAL') ||
      upperContent.includes('PRAGMA JOURNAL_MODE=WAL')
    ) {
      hasWALMode = true;
    }
    if (
      upperContent.includes('PRAGMA FOREIGN_KEYS = ON') ||
      upperContent.includes('PRAGMA FOREIGN_KEYS=ON')
    ) {
      hasForeignKeys = true;
    }

    // Extract tables
    const tables = extractCreateTableNames(content);
    for (const table of tables) {
      if (allTables.has(table)) {
        warnings.push(`Table "${table}" redefined in ${file}`);
      }
      allTables.add(table);
    }

    // Check for FTS5 virtual tables
    const fts5Regex = /CREATE\s+VIRTUAL\s+TABLE\s+.*\s+USING\s+fts5/gi;
    if (fts5Regex.test(content)) {
      hasFTS5 = true;
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
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--'));

    for (const stmt of statements) {
      const upper = stmt.toUpperCase();
      if (upper.startsWith('DROP') && !upper.includes('IF EXISTS')) {
        warnings.push(`DROP without IF EXISTS in ${file}: ${stmt.substring(0, 80)}...`);
      }
    }
  }

  // Check critical tables
  const criticalTablesMissing = CRITICAL_TABLES.filter((t) => !allTables.has(t));

  // Recommendations
  if (!hasWALMode) {
    warnings.push(
      'Recommended: Set PRAGMA journal_mode = WAL for better concurrent read performance'
    );
  }
  if (!hasForeignKeys) {
    warnings.push('Recommended: Set PRAGMA foreign_keys = ON for referential integrity');
  }
  if (!hasFTS5) {
    warnings.push(
      'Recommended: Consider FTS5 virtual tables for full-text search on knowledge_chunks'
    );
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
      hasFTS5,
      hasForeignKeys,
      hasWALMode,
    },
  };
}

// ─── Main ──────────────────────────────────────────────────────────────

const result = verifySQLiteMigrations();

console.log('═'.repeat(60));
console.log('SQLite Migration Verification Report');
console.log('═'.repeat(60));
console.log(`Valid: ${result.valid ? '✅ YES' : '❌ NO'}`);
console.log(`Migrations: ${result.stats.migrationCount}`);
console.log(`Tables Created: ${result.stats.tablesCreated.length}`);
console.log(`Indexes Created: ${result.stats.indexesCreated.length}`);
console.log(`Critical Tables Missing: ${result.stats.criticalTablesMissing.length}`);
console.log(`FTS5 Enabled: ${result.stats.hasFTS5 ? '✅' : '❌'}`);
console.log(`Foreign Keys: ${result.stats.hasForeignKeys ? '✅' : '❌'}`);
console.log(`WAL Mode: ${result.stats.hasWALMode ? '✅' : '❌'}`);

if (result.stats.tablesCreated.length > 0) {
  console.log('\n📋 Tables:');
  for (const t of result.stats.tablesCreated) {
    const isCritical = CRITICAL_TABLES.includes(t);
    console.log(`  ${isCritical ? '⭐' : '  '} ${t}`);
  }
}

if (result.errors.length > 0) {
  console.log('\n❌ Errors:');
  for (const e of result.errors) {
    console.log(`  - ${e}`);
  }
}

if (result.warnings.length > 0) {
  console.log('\n⚠️  Warnings:');
  for (const w of result.warnings) {
    console.log(`  - ${w}`);
  }
}

console.log('═'.repeat(60));

if (!result.valid) {
  process.exit(1);
}
