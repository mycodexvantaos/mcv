#!/usr/bin/env npx ts-node
// ═══════════════════════════════════════════════════════════════════════
// MyCodexVantaOS — Contract Validation CLI
// Validates all service definitions, schemas, and cross-references
// Usage: npx ts-node tools/validate-contracts.ts [--fix] [--verbose]
// ═══════════════════════════════════════════════════════════════════════

import * as fs from 'fs';
import * as path from 'path';

// ── Types ──────────────────────────────────────────────────────────────
interface ValidationResult {
  file: string;
  status: 'pass' | 'fail' | 'warn';
  errors: string[];
  warnings: string[];
}

// ── Constants ──────────────────────────────────────────────────────────
const VALID_SERVICE_NAMES = [
  'identity',
  'workspace',
  'knowledge-store',
  'knowledge-search',
  'agent-chat',
  'model-byok',
  'audit-log',
  'usage-meter',
];

const CONTRACTS_DIR = path.resolve(__dirname, '..', 'contracts');
const ROOT_DIR = path.resolve(__dirname, '..');

// ── YAML Parser (simple, no dependency) ────────────────────────────────
function parseSimpleYaml(content: string): any {
  // Minimal YAML parsing for validation purposes
  // For production, use js-yaml library
  try {
    const lines = content.split('\n');
    const result: any = {};
    let currentPath: string[] = [];
    let currentObj = result;

    for (const line of lines) {
      const trimmed = line.trimEnd();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const indent = line.length - line.trimStart().length;
      const keyMatch = trimmed.match(/^(\w[\w-]*):\s*(.*)$/);
      if (keyMatch) {
        const key = keyMatch[1];
        const value = keyMatch[2].trim();
        if (value) {
          currentObj[key] =
            value.startsWith('"') || value.startsWith("'") ? value.slice(1, -1) : value;
        } else {
          currentObj[key] = {};
        }
      }
    }
    return result;
  } catch {
    return null;
  }
}

// ── Validators ─────────────────────────────────────────────────────────

function validateServiceDefinition(filePath: string): ValidationResult {
  const result: ValidationResult = { file: filePath, status: 'pass', errors: [], warnings: [] };
  const content = fs.readFileSync(filePath, 'utf-8');

  if (!content || content.length === 0) {
    result.errors.push('File is empty');
    result.status = 'fail';
    return result;
  }

  // Check for required sections
  if (!content.includes('metadata:')) {
    result.errors.push('Missing metadata section');
  }
  if (!content.includes('spec:')) {
    result.errors.push('Missing spec section');
  }
  if (!content.includes('capabilities:')) {
    result.warnings.push('No capabilities defined');
  }

  // Extract service name from filename
  const basename = path.basename(filePath, '.yaml');
  if (basename !== 'service-catalog' && !VALID_SERVICE_NAMES.includes(basename)) {
    result.warnings.push(`Filename "${basename}" not in valid service names`);
  }

  // Check for key fields
  if (!content.includes('name:') && basename !== 'service-catalog') {
    result.errors.push('Missing metadata.name field');
  }
  if (!content.includes('level:') && basename !== 'service-catalog') {
    result.warnings.push('Missing metadata.level field');
  }
  if (!content.includes('runtime:') && basename !== 'service-catalog') {
    result.errors.push('Missing spec.runtime field');
  }

  if (result.errors.length > 0) result.status = 'fail';
  else if (result.warnings.length > 0) result.status = 'warn';

  return result;
}

function validateSchema(filePath: string): ValidationResult {
  const result: ValidationResult = { file: filePath, status: 'pass', errors: [], warnings: [] };
  const content = fs.readFileSync(filePath, 'utf-8');

  try {
    const parsed = JSON.parse(content);

    if (!parsed.$schema) {
      result.warnings.push('no $schema specified');
    }
    if (!parsed.title) {
      result.warnings.push('no title specified');
    }
    if (!parsed.type && !parsed.oneOf && !parsed.anyOf && !parsed.allOf) {
      result.errors.push('schema must define type, oneOf, anyOf, or allOf');
    }
  } catch (e: any) {
    result.errors.push(`JSON parse error: ${e.message}`);
    result.status = 'fail';
    return result;
  }

  if (result.errors.length > 0) result.status = 'fail';
  else if (result.warnings.length > 0) result.status = 'warn';

  return result;
}

function validateCrossReferences(): ValidationResult {
  const result: ValidationResult = {
    file: 'cross-reference-check',
    status: 'pass',
    errors: [],
    warnings: [],
  };

  const serviceDir = path.join(CONTRACTS_DIR, 'service-definitions');
  if (!fs.existsSync(serviceDir)) {
    result.errors.push('service-definitions directory not found');
    result.status = 'fail';
    return result;
  }

  const files = fs
    .readdirSync(serviceDir)
    .filter((f) => f.endsWith('.yaml') && f !== 'service-catalog.yaml');

  // Check all 8 MVP services have definitions
  const foundServices = files.map((f) => path.basename(f, '.yaml'));
  for (const name of VALID_SERVICE_NAMES) {
    if (!foundServices.includes(name)) {
      result.errors.push(`missing service definition for: ${name}`);
    }
  }

  if (result.errors.length > 0) result.status = 'fail';
  else if (result.warnings.length > 0) result.status = 'warn';

  return result;
}

// ── Main ───────────────────────────────────────────────────────────────
function main() {
  const verbose = process.argv.includes('--verbose');
  const results: ValidationResult[] = [];

  console.log('════════════════════════════════════════════════════════');
  console.log('  MyCodexVantaOS — Contract Validation');
  console.log('════════════════════════════════════════════════════════\n');

  // Validate service definitions
  const serviceDir = path.join(CONTRACTS_DIR, 'service-definitions');
  if (fs.existsSync(serviceDir)) {
    for (const file of fs.readdirSync(serviceDir).filter((f) => f.endsWith('.yaml'))) {
      results.push(validateServiceDefinition(path.join(serviceDir, file)));
    }
  }

  // Validate schemas
  const schemaDir = path.join(CONTRACTS_DIR, 'schemas');
  if (fs.existsSync(schemaDir)) {
    for (const file of fs.readdirSync(schemaDir).filter((f) => f.endsWith('.json'))) {
      results.push(validateSchema(path.join(schemaDir, file)));
    }
  }

  // Cross-reference validation
  results.push(validateCrossReferences());

  // Report
  let passCount = 0,
    warnCount = 0,
    failCount = 0;
  for (const result of results) {
    const icon = result.status === 'pass' ? '✅' : result.status === 'warn' ? '⚠️' : '❌';
    console.log(`${icon} ${path.relative(ROOT_DIR, result.file)}`);

    for (const err of result.errors) {
      console.log(`   ERROR: ${err}`);
    }
    if (verbose) {
      for (const warn of result.warnings) {
        console.log(`   WARN:  ${warn}`);
      }
    }

    if (result.status === 'pass') passCount++;
    else if (result.status === 'warn') warnCount++;
    else failCount++;
  }

  console.log('\n──────────────────────────────────────────────────────');
  console.log(`Results: ${passCount} pass, ${warnCount} warn, ${failCount} fail`);
  console.log('──────────────────────────────────────────────────────\n');

  if (failCount > 0) process.exit(1);
}

main();
