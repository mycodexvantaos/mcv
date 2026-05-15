<div align="center">

# CodexVanta OS — Observability Stack

**Unified Telemetry, Metrics, Logging & Distributed Tracing**

[![CI](https://img.shields.io/github/actions/workflow/status/codexvanta/codexvanta-os-observability-stack/ci.yml?branch=main&label=CI)](../../actions)
[![Provider Architecture](https://img.shields.io/badge/architecture-Native--first-blue)](#architecture)
[![Tier](https://img.shields.io/badge/tier-2-yellow)](#dependency-tier)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

---

## Overview

`observability-stack` provides the unified telemetry, metrics collection, structured logging, and distributed tracing infrastructure for the entire CodexVanta OS platform. It implements the ObservabilityProvider interface, giving all services a consistent API for emitting metrics, logs, and traces. In Native mode, telemetry is collected in-memory and written to local files. In Connected mode, it integrates with external observability platforms (Prometheus, Grafana, Jaeger, ELK) via configurable exporters.

## Key Capabilities

- **Metrics Collection** — Counters, gauges, histograms with dimensional labels
- **Structured Logging** — JSON-structured log output with correlation IDs
- **Distributed Tracing** — OpenTelemetry-compatible trace propagation across services
- **Alerting Rules** — Configurable alert thresholds with notification routing
- **Dashboard Data** — Pre-aggregated metrics for control-center dashboards
- **Log Aggregation** — Centralized log collection with search and filtering
- **Health Synthesis** — Derives service health from telemetry signals

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                 observability-stack                        │
│                                                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │ Metrics  │  │ Logging  │  │ Tracing  │               │
│  │ Collector│  │ Pipeline │  │ Collector│               │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘               │
│       │              │              │                     │
│       └──────────────┼──────────────┘                     │
│                      │                                    │
│               ┌──────▼──────┐                             │
│               │ Telemetry   │                             │
│               │ Aggregator  │                             │
│               └──────┬──────┘                             │
│                      │                                    │
│         ┌────────────┼────────────┐                       │
│         ▼            ▼            ▼                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                 │
│  │ Local    │ │ Dashboard│ │ Alert    │                 │
│  │ Storage  │ │ Data API │ │ Evaluator│                 │
│  └──────────┘ └──────────┘ └──────────┘                 │
└──────────────────────────────────────────────────────────┘
```

## Provider Dependencies

| Provider             | Usage                                         |
| -------------------- | --------------------------------------------- |
| DatabaseProvider     | Metrics storage, log persistence, trace spans |
| StorageProvider      | Log file archives, trace export files         |
| StateStoreProvider   | Alert state, dashboard configurations         |
| NotificationProvider | Alert delivery to configured channels         |

## Operational Modes

| Mode          | Behavior                                                    |
| ------------- | ----------------------------------------------------------- |
| **Native**    | In-memory metrics, local JSON log files, SQLite trace store |
| **Connected** | Prometheus/Grafana metrics, ELK logging, Jaeger tracing     |
| **Hybrid**    | Local collection with external dashboard and alerting       |

## Directory Structure

```
codexvanta-os-observability-stack/
├── src/
│   ├── index.ts
│   └── services/
│       ├── ObservabilityStackService.ts
│       ├── MetricsService.ts
│       ├── LoggingService.ts
│       └── TracingService.ts
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
  └─▶ Tier 1: config-manager, infra-base, ...
       └─▶ Tier 2: observability-stack ◀── You are here
```

## Quick Start

```bash
pnpm install
pnpm build
pnpm test
```

## Related Packages

- [`core-kernel`](../codexvanta-os-core-kernel) — ObservabilityProvider interface
- [`control-center`](../codexvanta-os-control-center) — Dashboard consumer
- [`network-mesh`](../codexvanta-os-network-mesh) — Distributed tracing integration

---

<div align="center">
<sub>Part of the <a href="https://github.com/codexvanta">CodexVanta OS</a> platform — Native-first / Provider-agnostic Architecture</sub>
</div>
