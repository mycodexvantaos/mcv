# @mycodexvantaos/storage

Object storage service - Manages files, images, and media with cloud-agnostic interfaces

## Installation

```bash
pnpm add @mycodexvantaos/storage
```

## Usage

```typescript
import { storage } from '@mycodexvantaos/storage';

// Initialize
await storage.initialize();

// Execute
const result = await storage.execute(input);
```

## Features

- Local-first operation
- Cloud-agnostic design
- Contract-first interfaces
- Governance-enforced compliance

## API Reference

### `initialize(): Promise<void>`

Initialize the package.

### `execute<T>(input: any): Promise<T>`

Execute package functionality.

### `cleanup(): Promise<void>`

Cleanup package resources.

## License

MIT
