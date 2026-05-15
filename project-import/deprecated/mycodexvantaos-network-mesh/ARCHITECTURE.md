# Network Mesh — Architecture Document

## Purpose

`network-mesh` provides the inter-service communication layer for CodexVanta OS. It abstracts transport mechanisms behind a unified API, enabling the same service communication code to work with in-process calls (Native) or network requests (Connected).

## Service Registry Model

```
┌──────────────────────────────────────┐
│          Service Registry            │
│                                      │
│  service-a@v1.0 → [instance-1:3001, │
│                     instance-2:3002] │
│  service-b@v1.0 → [instance-1:4001] │
│  service-c@v2.0 → [instance-1:5001, │
│                     instance-2:5002, │
│                     instance-3:5003] │
└──────────────────────────────────────┘
```

## Routing Decision Flow

```
Request
   │
   ▼
┌──────────────┐
│ Rate Limit   │──▶ 429 if exceeded
│ Check        │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Circuit      │──▶ 503 if open
│ Breaker      │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Load         │──▶ Select instance
│ Balancer     │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Health       │──▶ Skip unhealthy
│ Filter       │
└──────┬───────┘
       │
       ▼
  Route to instance
```

## Circuit Breaker States

```
┌────────┐   failure threshold   ┌──────┐
│ Closed │ ────────────────────▶ │ Open │
│        │                       │      │
└────┬───┘                       └──┬───┘
     ▲                              │
     │    success threshold         │ timeout
     │                              │
     └──────── ┌──────────┐ ◀──────┘
               │ Half-Open│
               └──────────┘
```

## Load Balancing Strategies

| Strategy          | Description                                         |
| ----------------- | --------------------------------------------------- |
| Round-Robin       | Sequential distribution across instances            |
| Least-Connections | Route to instance with fewest active connections    |
| Weighted          | Proportional distribution based on instance weights |
| Random            | Random instance selection                           |
| Sticky            | Same client always routes to same instance          |

## Native vs Connected Transport

| Feature        | Native                   | Connected             |
| -------------- | ------------------------ | --------------------- |
| Transport      | In-process function call | HTTP/gRPC             |
| Latency        | ~0ms (same process)      | Network RTT           |
| Serialization  | None (object reference)  | JSON/Protobuf         |
| Authentication | Process-level trust      | mTLS certificates     |
| Load Balancing | Round-robin              | Full strategy support |

## Design Principles

1. **Transport Abstraction** — Service code doesn't know about transport mechanism
2. **Health-First Routing** — Never route to unhealthy instances
3. **Fail-Fast** — Circuit breaker prevents cascade failures
4. **Observable** — Every request traced with correlation IDs
5. **Zero-Config Native** — In-process routing requires no configuration
