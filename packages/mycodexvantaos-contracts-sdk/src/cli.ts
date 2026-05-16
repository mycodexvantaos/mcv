#!/usr/bin/env node
/**
 * @mycodexvantaos/contracts-sdk CLI
 * Validates all platform contracts (service definitions, resource kinds,
 * policies, events, schemas).
 *
 * Usage:
 *   node --import tsx packages/mycodexvantaos-contracts-sdk/src/cli.ts validate
 */

import { validateAllContracts } from './index.js';

const command = process.argv[2];

if (command === 'validate') {
  const result = validateAllContracts();
  const allValid = result.services.valid && result.resourceKinds.valid && result.policies.valid && result.events.valid;
  const allErrors = [
    ...result.services.errors,
    ...result.resourceKinds.errors,
    ...result.policies.errors,
    ...result.events.errors,
  ];

  if (allValid) {
    console.log('✅ All contracts validate');
    process.exit(0);
  } else {
    console.error('❌ Contract validation failed');
    for (const err of allErrors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }
} else {
  console.error('Usage: contracts-sdk <validate>');
  console.error('');
  console.error('Commands:');
  console.error('  validate   Validate all platform contracts');
  process.exit(1);
}
