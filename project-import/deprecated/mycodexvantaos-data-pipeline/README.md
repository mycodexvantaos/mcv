<div align="center">

# CodexVanta OS — Data Pipeline

**Streaming Data Ingestion, Transformation & Routing Engine**

[![CI](https://img.shields.io/github/actions/workflow/status/codexvanta/codexvanta-os-data-pipeline/ci.yml?branch=main&label=CI)](../../actions)
[![Provider Architecture](https://img.shields.io/badge/architecture-Native--first-blue)](#architecture)
[![Tier](https://img.shields.io/badge/tier-2-yellow)](#dependency-tier)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

---

## Overview

`data-pipeline` provides the platform's streaming data ingestion, transformation, and routing engine. It processes data flows from multiple sources — repository events, telemetry streams, audit logs, scan results — through configurable transformation stages and routes them to appropriate storage backends via Provider interfaces. All processing works in Native mode with in-memory streams and persists to the Native DatabaseProvider.

## Key Capabilities

- **Stream Ingestion** — Accepts data from event-bus, webhooks, file uploads, and scheduled pulls
- **Transformation Stages** — Configurable pipeline stages: filter, map, enrich, aggregate, deduplicate
- **Routing Engine** — Routes processed data to storage, observability, or external sinks via Providers
- **Backpressure Management** — Flow control with configurable buffer sizes and overflow policies
- **Schema Validation** — Validates data against registered schemas before processing
- **Dead Letter Queue** — Failed records routed to DLQ for inspection and retry
- **Pipeline Composition** — Declarative pipeline definitions via YAML or programmatic API

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    data-pipeline                         │
│                                                          │
│  ┌──────────┐   ┌──────────────┐   ┌────────────────┐  │
│  │ Ingestion│──▶│ Transform    │──▶│ Routing        │  │
│  │ Sources  │   │ Stages       │   │ Engine         │  │
│  └──────────┘   └──────────────┘   └───────┬────────┘  │
│       │                                      │          │
│       │         ┌──────────────┐             │          │
│       └────────▶│ Schema       │             ▼          │
│                 │ Validator    │   ┌────────────────┐   │
│                 └──────────────┘   │ Provider Sinks │   │
│                                    │ DB / Storage / │   │
│  ┌──────────┐                      │ Observability  │   │
│  │ Dead     │◀── failed records    └────────────────┘   │
│  │ Letter Q │                                           │
│  └──────────┘                                           │
└─────────────────────────────────────────────────────────┘
```

## Provider Dependencies

| Provider              | Usage                                                    |
| --------------------- | -------------------------------------------------------- |
| DatabaseProvider      | Persistent storage for processed data and pipeline state |
| StorageProvider       | File/blob storage for large payloads                     |
| QueueProvider         | Internal message buffering and backpressure              |
| ObservabilityProvider | Pipeline metrics, throughput, latency tracking           |
| StateStoreProvider    | Pipeline checkpoint and cursor state                     |

## Operational Modes

| Mode          | Behavior                                             |
| ------------- | ---------------------------------------------------- |
| **Native**    | In-memory streams, SQLite storage, local file sinks  |
| **Connected** | Kafka/Redis streams, PostgreSQL storage, S3 sinks    |
| **Hybrid**    | Mixed — e.g. Kafka ingestion with SQLite local cache |

## Directory Structure

```
codexvanta-os-data-pipeline/
├── src/
│   ├── index.ts
│   └── services/
│       ├── DataPipelineService.ts
│       ├── IngestionService.ts
│       ├── TransformService.ts
│       └── RoutingService.ts
├── tests/
│   └── index.test.ts
├── REPO_MANIFEST.yaml
├── package.json
├── tsconfig.json
└── README.md
```

## Dependency Tier

**Tier 2** — Depends on `core-kernel` (Tier 0) and Tier 1 packages.

```
Tier 0: core-kernel
  └─▶ Tier 1: config-manager, event-bus, ...
       └─▶ Tier 2: data-pipeline ◀── You are here
```

## Quick Start

```bash
pnpm install
pnpm build
pnpm test
```

## Related Packages

- [`event-bus`](../codexvanta-os-event-bus) — Event source for pipeline ingestion
- [`observability-stack`](../codexvanta-os-observability-stack) — Metrics sink
- [`core-kernel`](../codexvanta-os-core-kernel) — Provider interfaces

---

<div align="center">
<sub>Part of the <a href="https://github.com/codexvanta">CodexVanta OS</a> platform — Native-first / Provider-agnostic Architecture</sub>
</div>
