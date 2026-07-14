/**
 * Package Optimization Script
 * Standardizes all package.json files with consistent configuration
 */

import * as fs from 'fs';
import * as path from 'path';

interface PackageJson {
  name: string;
  version: string;
  description?: string;
  main: string;
  types: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  license?: string;
  repository?: { type: string; url: string; directory?: string };
  author?: string;
  keywords?: string[];
}

const packagesDir = path.join(__dirname, '..', 'packages');
const packages = fs
  .readdirSync(packagesDir)
  .filter((f) => fs.statSync(path.join(packagesDir, f)).isDirectory());

const standardDevDeps = {
  typescript: '^5.0.0',
  '@types/node': '^20.0.0',
  jest: '^29.0.0',
  '@types/jest': '^29.0.0',
  'ts-jest': '^29.0.0',
};

const standardScripts = {
  build: 'tsc',
  test: 'jest --config ../../jest.config.js',
  clean: 'rm -rf dist',
  lint: 'eslint src/**/*.ts',
};

const descriptions: Record<string, string> = {
  'ai-agent': 'AI agent orchestration and execution',
  'ai-embedding': 'AI embedding generation and management',
  'ai-llm': 'Large Language Model integration and management',
  'ai-memory': 'AI memory and context management',
  builder: 'Application generation and build layer',
  'config-sync': 'GitOps-driven configuration synchronization',
  'core-auth': 'Core authentication and authorization',
  'core-config': 'Core configuration management',
  'core-gateway': 'API gateway and routing',
  'core-kernel': 'Core kernel and system initialization',
  'data-graph': 'Graph database integration',
  'data-pipeline': 'Data pipeline and ETL processing',
  'data-vector-store': 'Vector database integration for AI',
  database: 'Relational database service with ACID compliance',
  deployment: 'Deployment management and integration',
  'docs-search': 'Documentation search and indexing',
  events: 'Event processing with pub/sub and streaming',
  'governance-policy': 'Governance policy management and validation',
  monitoring: 'Monitoring and observability with metrics, logs, traces',
  'platform-notification': 'Platform notification and alerting',
  'platform-observability': 'Platform observability and monitoring',
  'platform-scheduler': 'Job scheduling and cron management',
  runtime: 'Application runtime execution environment',
  'security-secrets': 'Secrets management and encryption',
  'security-validation': 'Security validation and compliance',
  'service-discovery': 'Service registration, discovery, and health monitoring',
  storage: 'Object storage service with cloud-agnostic interfaces',
};

const layers: Record<string, string> = {
  'ai-agent': 'ai-ml',
  'ai-embedding': 'ai-ml',
  'ai-llm': 'ai-ml',
  'ai-memory': 'ai-ml',
  builder: 'builder',
  'config-sync': 'native-services',
  'core-auth': 'native-services',
  'core-config': 'native-services',
  'core-gateway': 'native-services',
  'core-kernel': 'native-services',
  'data-graph': 'data',
  'data-pipeline': 'data',
  'data-vector-store': 'data',
  database: 'data',
  deployment: 'deployment-target',
  'docs-search': 'native-services',
  events: 'native-services',
  'governance-policy': 'governance',
  monitoring: 'native-services',
  'platform-notification': 'native-services',
  'platform-observability': 'native-services',
  'platform-scheduler': 'native-services',
  runtime: 'runtime',
  'security-secrets': 'security',
  'security-validation': 'security',
  'service-discovery': 'native-services',
  storage: 'data',
};

console.log('Optimizing package.json files...\n');

let updatedCount = 0;

for (const pkg of packages) {
  const pkgPath = path.join(packagesDir, pkg, 'package.json');

  if (!fs.existsSync(pkgPath)) {
    console.log(`Creating package.json for ${pkg}`);
    continue;
  }

  const pkgJson: PackageJson = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  const originalContent = JSON.stringify(pkgJson, null, 2);

  // Update description
  if (descriptions[pkg]) {
    pkgJson.description = descriptions[pkg];
  }

  // Ensure standard fields
  pkgJson.main = 'dist/index.js';
  pkgJson.types = 'dist/index.d.ts';
  pkgJson.license = 'MIT';

  // Add standard scripts
  pkgJson.scripts = {
    ...standardScripts,
    ...pkgJson.scripts,
  };

  // Add standard devDependencies
  pkgJson.devDependencies = {
    ...standardDevDeps,
    ...pkgJson.devDependencies,
  };

  // Ensure dependencies object exists
  if (!pkgJson.dependencies) {
    pkgJson.dependencies = {};
  }

  // Add repository info
  pkgJson.repository = {
    type: 'git',
    url: 'https://github.com/mycodexvantaos/platform.git',
    directory: `packages/${pkg}`,
  };

  // Add author
  pkgJson.author = 'MyCodexVantaOS Team';

  // Add keywords
  pkgJson.keywords = ['mycodexvantaos', layers[pkg] || 'platform', pkg];

  const newContent = JSON.stringify(pkgJson, null, 2);

  if (newContent !== originalContent) {
    fs.writeFileSync(pkgPath, newContent + '\n');
    console.log(`✓ Updated ${pkg}`);
    updatedCount++;
  } else {
    console.log(`  Skipped ${pkg} (no changes needed)`);
  }
}

console.log(`\nOptimization complete. Updated ${updatedCount} packages.`);
