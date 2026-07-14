#!/usr/bin/env npx ts-node
// ═══════════════════════════════════════════════════════════════════════
// MyCodexVantaOS — Service Scaffold Generator
// Generates boilerplate for a new service from the contract definition
// Usage: npx ts-node tools/generate-service.ts <service-name>
// ═══════════════════════════════════════════════════════════════════════

import * as fs from 'fs';
import * as path from 'path';

const ROOT_DIR = path.resolve(__dirname, '..');
const SERVICE_NAME = process.argv[2];

if (!SERVICE_NAME) {
  console.error('Usage: npx ts-node tools/generate-service.ts <service-name>');
  console.error('Example: npx ts-node tools/generate-service.ts my-service');
  process.exit(1);
}

function toPascalCase(kebab: string): string {
  return kebab
    .split('-')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('');
}

const ClassName = toPascalCase(SERVICE_NAME);

// ── Generate Application Service ───────────────────────────────────────
const appServiceContent = `// ═══════════════════════════════════════════════════════════════════════
// MyCodexVantaOS — ${ClassName} Application Service
// Auto-generated from contracts/service-definitions/${SERVICE_NAME}.yaml
// ═══════════════════════════════════════════════════════════════════════

import type {
  IDatabasePort,
  ICachePort,
  IStoragePort,
  ISearchPort,
  IModelPort,
  IQueuePort,
  IAuditPort,
  IUsagePort,
} from '../ports';

// ── Service Dependencies ───────────────────────────────────────────────
export interface ${ClassName}ServiceDeps {
  database: IDatabasePort;
  cache: ICachePort;
  audit: IAuditPort;
  queue: IQueuePort;
}

// ── Service Implementation ─────────────────────────────────────────────
export class ${ClassName}Service {
  constructor(private readonly deps: ${ClassName}ServiceDeps) {}

  // TODO: Implement capabilities from contracts/service-definitions/${SERVICE_NAME}.yaml
  // Each capability should:
  //   1. Authorize via policy
  //   2. Execute business logic
  //   3. Emit audit event
  //   4. Return result
}

// ── Service Factory ────────────────────────────────────────────────────
export function create${ClassName}Service(deps: ${ClassName}ServiceDeps): ${ClassName}Service {
  return new ${ClassName}Service(deps);
}
`;

// ── Generate Wrangler Config ───────────────────────────────────────────
const wranglerContent = `#: ${ClassName} Service — Cloudflare Worker Configuration
name = "${SERVICE_NAME}"
main = "runtimes/cloudflare/worker-entry.ts"
compatibility_date = "2024-12-01"
compatibility_flags = ["nodejs_compat"]

[vars]
SERVICE_NAME = "${SERVICE_NAME}"

[[d1_databases]]
binding = "DB"
database_name = "${SERVICE_NAME}-db"
database_id = "TODO: Replace with actual database_id"

[[kv_namespaces]]
binding = "CACHE"
id = "TODO: Replace with actual kv_namespace_id"

[[r2_buckets]]
binding = "STORAGE"
bucket_name = "${SERVICE_NAME}-bucket"

[[queues.producers]]
queue = "${SERVICE_NAME}-events"

[[queues.consumers]]
queue = "${SERVICE_NAME}-events"
max_batch_size = 10
max_batch_timeout = 5

[limits]
cpu_ms = 50
`;

// ── Write Files ────────────────────────────────────────────────────────
function writeFile(filePath: string, content: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (fs.existsSync(filePath)) {
    console.log(`⏭️  Skipped (exists): ${path.relative(ROOT_DIR, filePath)}`);
    return;
  }
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`✅ Created: ${path.relative(ROOT_DIR, filePath)}`);
}

console.log('════════════════════════════════════════════════════════');
console.log(`  Generating scaffold for: ${SERVICE_NAME}`);
console.log('════════════════════════════════════════════════════════\n');

writeFile(path.join(ROOT_DIR, 'application', `${SERVICE_NAME}-service.ts`), appServiceContent);
writeFile(
  path.join(ROOT_DIR, 'infra', 'cloudflare', 'workers', `wrangler.${SERVICE_NAME}.toml`),
  wranglerContent
);

console.log('\n──────────────────────────────────────────────────────');
console.log('Next steps:');
console.log(`  1. Implement capabilities in application/${SERVICE_NAME}-service.ts`);
console.log(`  2. Update ports/ with any new port interfaces needed`);
console.log(`  3. Add adapter implementations in adapters/`);
console.log(`  4. Register in application/index.ts`);
console.log(`  5. Update runtimes/cloudflare/adapter.ts`);
console.log('──────────────────────────────────────────────────────');
