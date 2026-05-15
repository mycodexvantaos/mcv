#!/usr/bin/env npx tsx
/**
 * @module tools/generators/generate-adapter
 * @description Scaffolds a new adapter in the platform.
 *
 * Generates:
 *   1. packages/adapters/{adapter-name}/index.ts (adapter class implementing a port)
 *
 * Usage:
 *   npx tsx tools/generators/generate-adapter.ts <adapter-name> <port-name>
 *
 * Example:
 *   npx tsx tools/generators/generate-adapter.ts postgres-database database
 *   npx tsx tools/generators/generate-adapter.ts qdrant-search search
 */

import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '../..');

const VALID_PORTS = ['database', 'object-storage', 'search', 'model-provider', 'queue', 'auth'];

// ── Parse Args ──────────────────────────────────────────────────────────

const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('Usage: npx tsx tools/generators/generate-adapter.ts <adapter-name> <port-name>');
  console.error(`Ports: ${VALID_PORTS.join(', ')}`);
  process.exit(1);
}

const adapterName = args[0].toLowerCase().replace(/[^a-z0-9-]/g, '-');
const portName = args[1].toLowerCase();

if (!VALID_PORTS.includes(portName)) {
  console.error(`Invalid port: ${portName}`);
  console.error(`Valid ports: ${VALID_PORTS.join(', ')}`);
  process.exit(1);
}

const pascalAdapter = adapterName
  .split('-')
  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
  .join('');
const pascalPort = portName
  .split('-')
  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
  .join('');

const adapterClassName = `${pascalAdapter}Adapter`;
const portInterfaceName = `I${pascalPort}Port`;

console.log(
  `🔌 Generating adapter: ${adapterName} (${adapterClassName}) implementing ${portInterfaceName}\n`
);

// ── Generate Adapter Package ────────────────────────────────────────────

const adapterDir = path.join(ROOT, 'packages/adapters', adapterName);

if (fs.existsSync(adapterDir)) {
  console.error(`❌ Adapter package already exists: ${adapterDir}`);
  process.exit(1);
}

fs.mkdirSync(adapterDir, { recursive: true });

const adapterContent = `/**
 * @module packages/adapters/${adapterName}
 * @description ${adapterClassName} — implements ${portInterfaceName}.
 *
 * TODO: Implement adapter methods.
 */

import type { ${portInterfaceName} } from '@mycodexvantaos/ports/${portName}';

export class ${adapterClassName} implements ${portInterfaceName} {
  constructor(
    // TODO: Inject runtime-specific dependencies
  ) {
    // TODO: Initialise adapter
  }

  // TODO: Implement all methods from ${portInterfaceName}
}
`;

fs.writeFileSync(path.join(adapterDir, 'index.ts'), adapterContent);
console.log(`✅ Created: packages/adapters/${adapterName}/index.ts`);

// ── Summary ─────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(50)}`);
console.log('Adapter scaffolded! Next steps:');
console.log('');
console.log(`1. Implement packages/adapters/${adapterName}/index.ts`);
console.log(`2. Update packages/adapters/index.ts barrel re-export`);
console.log(`3. Update packages/adapters/package.json exports map`);
console.log(`4. Wire adapter in apps/api-worker/index.ts or runtimes/`);
