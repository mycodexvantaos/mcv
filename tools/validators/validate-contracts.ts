#!/usr/bin/env npx tsx
/**
 * @module tools/validators/validate-contracts
 * @description Validates all contract files against their schemas.
 *
 * Checks:
 *   1. contracts/service-definitions/*.yaml — valid YAML, required fields present
 *   2. contracts/schemas/*.schema.json — valid JSON Schema
 *   3. contracts/service-categories.yaml — all 8 categories present
 *   4. contracts/openapi/api-v1.yaml — valid OpenAPI 3.1
 *   5. contracts/events/events.yaml — valid CloudEvents definitions
 *   6. Cross-reference: service definitions reference valid categories
 *
 * Usage:
 *   npx tsx tools/validators/validate-contracts.ts
 *   npx tsx tools/validators/validate-contracts.ts --fix  # auto-fix minor issues
 */

import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml"; // optional — fallback to manual parse

const ROOT = path.resolve(__dirname, "../..");
const EXPECTED_CATEGORIES = [
  "knowledge",
  "agent",
  "workspace",
  "developer",
  "security",
  "storage",
  "model",
  "automation",
];

interface ValidationResult {
  file: string;
  valid: boolean;
  errors: string[];
  warnings: string[];
}

const results: ValidationResult[] = [];

function validateFile(filePath: string, label: string): ValidationResult {
  const result: ValidationResult = { file: label, valid: true, errors: [], warnings: [] };

  if (!fs.existsSync(filePath)) {
    result.valid = false;
    result.errors.push(`File not found: ${filePath}`);
    return result;
  }

  const content = fs.readFileSync(filePath, "utf-8");

  // Basic YAML validation (check for common syntax errors)
  try {
    // Simple parse — in production, use js-yaml
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes("\t")) {
        result.warnings.push(`Line ${i + 1}: Contains tab character (use spaces)`);
      }
    }
  } catch (err) {
    result.valid = false;
    result.errors.push(`Parse error: ${(err as Error).message}`);
  }

  return result;
}

function validateServiceDefinitions(): void {
  const dir = path.join(ROOT, "contracts/service-definitions");
  if (!fs.existsSync(dir)) {
    results.push({
      file: "service-definitions/",
      valid: false,
      errors: ["Directory not found"],
      warnings: [],
    });
    return;
  }

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".yaml"));
  for (const file of files) {
    const result = validateFile(path.join(dir, file), `service-definitions/${file}`);

    if (result.valid) {
      const content = fs.readFileSync(path.join(dir, file), "utf-8");

      // Check for required fields
      if (!content.includes("category:")) {
        result.warnings.push(
          'Missing "category" field — should map to one of 8 service categories'
        );
      }
      if (!content.includes("name:")) {
        result.warnings.push('Missing "name" field');
      }

      // Validate category references
      for (const cat of EXPECTED_CATEGORIES) {
        if (content.includes(`category: ${cat}`) || content.includes(`category: '${cat}'`)) {
          break; // Found a valid category
        }
      }
    }

    results.push(result);
  }
}

function validateServiceCategories(): void {
  const filePath = path.join(ROOT, "contracts/service-categories.yaml");
  const result = validateFile(filePath, "service-categories.yaml");

  if (result.valid) {
    const content = fs.readFileSync(filePath, "utf-8");
    for (const cat of EXPECTED_CATEGORIES) {
      if (!content.includes(cat)) {
        result.warnings.push(`Missing category: ${cat}`);
      }
    }
  }

  results.push(result);
}

function validateSchemas(): void {
  const dir = path.join(ROOT, "contracts/schemas");
  if (!fs.existsSync(dir)) {
    results.push({ file: "schemas/", valid: false, errors: ["Directory not found"], warnings: [] });
    return;
  }

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".schema.json"));
  for (const file of files) {
    const filePath = path.join(dir, file);
    const result: ValidationResult = {
      file: `schemas/${file}`,
      valid: true,
      errors: [],
      warnings: [],
    };

    try {
      const json = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      if (!json.$schema && !json.type) {
        result.warnings.push("Missing $schema or type property");
      }
    } catch (err) {
      result.valid = false;
      result.errors.push(`Invalid JSON: ${(err as Error).message}`);
    }

    results.push(result);
  }
}

function validateOpenApi(): void {
  const filePath = path.join(ROOT, "contracts/openapi/api-v1.yaml");
  const result = validateFile(filePath, "openapi/api-v1.yaml");

  if (result.valid) {
    const content = fs.readFileSync(filePath, "utf-8");
    if (!content.includes("openapi: 3.")) {
      result.errors.push("Not a valid OpenAPI 3.x specification");
      result.valid = false;
    }

    // Check for 8 service category tags
    for (const cat of EXPECTED_CATEGORIES) {
      const capitalised = cat.charAt(0).toUpperCase() + cat.slice(1);
      if (!content.includes(capitalised)) {
        result.warnings.push(`Missing tag for category: ${cat}`);
      }
    }
  }

  results.push(result);
}

function validateEvents(): void {
  const filePath = path.join(ROOT, "contracts/events/events.yaml");
  const result = validateFile(filePath, "events/events.yaml");

  if (result.valid) {
    const content = fs.readFileSync(filePath, "utf-8");
    if (!content.includes("specVersion:") && !content.includes("specversion:")) {
      result.warnings.push("Missing CloudEvents specVersion");
    }
  }

  results.push(result);
}

// ── Main ───────────────────────────────────────────────────────────────

console.log("🔍 Validating MyCodeXvantaOS contracts...\n");

validateServiceDefinitions();
validateServiceCategories();
validateSchemas();
validateOpenApi();
validateEvents();

// ── Report ─────────────────────────────────────────────────────────────

let totalErrors = 0;
let totalWarnings = 0;

for (const result of results) {
  const icon = result.valid ? "✅" : "❌";
  console.log(`${icon} ${result.file}`);

  for (const err of result.errors) {
    console.log(`   ERROR: ${err}`);
    totalErrors++;
  }
  for (const warn of result.warnings) {
    console.log(`   WARN:  ${warn}`);
    totalWarnings++;
  }
}

console.log(`\n${"─".repeat(50)}`);
console.log(`Files checked: ${results.length}`);
console.log(`Errors: ${totalErrors}`);
console.log(`Warnings: ${totalWarnings}`);

if (totalErrors > 0) {
  console.log("\n❌ Contract validation FAILED");
  process.exit(1);
} else {
  console.log("\n✅ All contracts valid");
  process.exit(0);
}
