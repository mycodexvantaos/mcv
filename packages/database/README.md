# @mycodexvantaos/database

Relational database service - Provides ACID-compliant relational database with migration support

## Installation

```bash
pnpm add @mycodexvantaos/database
```

## Usage

```typescript
import { database } from "@mycodexvantaos/database";

// Initialize
await database.initialize();

// Execute
const result = await database.execute(input);
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
