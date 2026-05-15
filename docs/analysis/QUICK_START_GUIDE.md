# MyCodeXvantaOS Quick Start Guide

## Prerequisites

- Node.js 18.x or higher
- pnpm 8.x or higher
- Git

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd mycodexvantaos

# Install dependencies
pnpm install

# Build all packages
pnpm build
```

## Architecture Overview

MyCodeXvantaOS is organized into 6 architecture layers:

1. **Builder** - Application generation and synthesis
2. **Runtime** - Application execution environment
3. **Native Services** - Core platform services
4. **Provider** - External service adapters
5. **Deployment Target** - Deployment infrastructure
6. **Governance** - Policy enforcement and validation

## Core Principles

- **Local-First**: Platform functions with zero external dependencies
- **Cloud-Agnostic**: No vendor lock-in at architecture level
- **Contract-First**: Interfaces defined before implementations
- **Governance-Enforced**: Rules are machine-enforceable

## Basic Usage

### 1. Generate an Application

```typescript
import { builder } from '@mycodexvantaos/builder';

const app = await builder.generate({
  name: 'my-app',
  type: 'fullstack',
  features: ['api', 'database', 'auth'],
});
```

### 2. Execute in Runtime

```typescript
import { runtime } from '@mycodexvantaos/runtime';

const result = await runtime.execute({
  application: 'my-app',
  environment: 'local',
  validation: true,
});
```

### 3. Deploy Application

```typescript
import { deployment } from '@mycodexvantaos/deployment';

await deployment.deploy({
  application: 'my-app',
  target: 'kubernetes',
  config: {
    replicas: 3,
    resources: {
      cpu: '1',
      memory: '512Mi',
    },
  },
});
```

### 4. Monitor Services

```typescript
import { monitoring } from '@mycodexvantaos/monitoring';

const metrics = await monitoring.getMetrics({
  services: ['my-app'],
  timeframe: '1h',
  metrics: ['cpu', 'memory', 'requests'],
});
```

## Validation & Governance

### Run Architecture Validation

```bash
# Validate architecture compliance
pnpm run validate

# Run governance checks
pnpm run governance-check
```

### CI/CD Pipeline

The project includes comprehensive CI/CD validation:

- ✅ Architecture compliance checks
- ✅ Package structure validation
- ✅ Naming convention enforcement
- ✅ Capability declaration verification
- ✅ Build and test execution

## Package Structure

```
mycodexvantaos/
├── packages/
│   ├── builder/              # Application generation
│   ├── runtime/              # Execution environment
│   ├── deployment/           # Deployment management
│   ├── service-discovery/    # Service registration
│   ├── config-sync/          # Configuration management
│   ├── storage/              # Object storage
│   ├── database/             # Database service
│   ├── events/               # Event processing
│   ├── monitoring/           # Observability
│   └── ...                   # Other packages
├── ci/                       # CI/CD configuration
├── providers/                # Provider manifests
├── capabilities/             # Capability declarations
└── governance.json           # Governance manifest
```

## Development Workflow

### 1. Create New Package

```bash
# Follow naming convention: @mycodexvantaos/package-name
mkdir packages/my-package
cd packages/my-package

# Create package structure
mkdir src
touch package.json tsconfig.json src/index.ts README.md
```

### 2. Define Capability

Create capability declaration in `capabilities/my-package.yaml`:

```yaml
id: urn:mycodexvantaos:capability:my-package
name: My Package
version: 1.0.0
description: Package description
status: stable

contract:
  interfaces:
    - initialize
    - execute
    - cleanup
```

### 3. Implement Package

```typescript
// src/index.ts
export class MyPackage {
  async initialize(): Promise<void> {
    // Initialization logic
  }

  async execute<T>(input: any): Promise<T> {
    // Main functionality
    return {} as T;
  }

  async cleanup(): Promise<void> {
    // Cleanup logic
  }
}
```

### 4. Test & Validate

```bash
# Build package
pnpm --filter @mycodexvantaos/my-package build

# Run tests
pnpm --filter @mycodexvantaos/my-package test

# Validate architecture
pnpm run validate
```

## Configuration

### Environment Variables

```bash
# Runtime mode (native, connected, hybrid)
export MYCODEXVANTAOS_RUNTIME_MODE=native

# Governance enforcement
export MYCODEXVANTAOS_GOVERNANCE_ENABLED=true

# Logging level
export MYCODEXVANTAOS_LOG_LEVEL=info
```

### Provider Configuration

Configure providers in `providers/` directory:

```json
{
  "id": "urn:mycodexvantaos:provider:my-provider",
  "name": "My Provider",
  "type": "deployment",
  "config": {
    "supportedModes": ["native", "connected"],
    "settings": {}
  }
}
```

## Troubleshooting

### Common Issues

**Build fails with TypeScript errors:**

```bash
# Clear cache and rebuild
rm -rf node_modules dist
pnpm install
pnpm build
```

**Validation fails for naming conventions:**

- Ensure package names start with `@mycodexvantaos/`
- Check URN format: `urn:mycodexvantaos:category:item:version`

**Runtime errors in native mode:**

- Verify `MYCODEXVANTAOS_RUNTIME_MODE=native`
- Check local dependencies are installed
- Review capability declarations

## Resources

- [Architecture Specification](./mycodexvantaos-architecture-specification.txt)
- [Governance Manifest](./governance.json)
- [Capability Declarations](./capabilities/)
- [Provider Manifests](./providers/)
- [API Documentation](./docs/)

## Contributing

1. Follow MyCodeXvantaOS naming conventions
2. Implement proper capability declarations
3. Add comprehensive tests
4. Ensure governance compliance
5. Update documentation

## License

MIT License - See LICENSE file for details

---

**Get started with MyCodeXvantaOS and build cloud-agnostic, local-first applications!**
