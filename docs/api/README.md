# MyCodeXvantaOS API Reference

This directory contains API documentation for the MyCodeXvantaOS platform.

## Overview

The platform exposes a RESTful API organized by the **8 service categories**:

| Category | Base Path | Description |
|----------|-----------|-------------|
| Knowledge | `/api/v1/knowledge/**` | Document ingestion, vector search, collections |
| Agent | `/api/v1/agent/**` | Conversational AI sessions with RAG |
| Workspace | `/api/v1/workspace/**` | Multi-tenant workspace management |
| Developer | `/api/v1/developer/**` | API keys, SDKs, webhooks (reserved) |
| Security | `/api/v1/security/**` | Identity, authentication, authorization |
| Storage | `/api/v1/storage/**` | Object storage, presigned URLs (reserved) |
| Model | `/api/v1/model/**` | LLM and embedding model routing |
| Automation | `/api/v1/automation/**` | Job queues, scheduled tasks |

## OpenAPI Specification

The full OpenAPI 3.1 specification is available at [`contracts/openapi/api-v1.yaml`](../../contracts/openapi/api-v1.yaml).

## Event Contract

All platform events follow the [CloudEvents v1.0](https://cloudevents.io/) specification. See [`contracts/events/events.yaml`](../../contracts/events/events.yaml) for the complete event catalog.

## Authentication

All API endpoints (except `/health` and `/security/token`) require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <jwt-token>
```

Tokens are obtained via `POST /api/v1/security/token`.

## Rate Limiting

Rate limits are enforced per subject and vary by workspace tier:

| Tier | Requests/minute | Tokens/day |
|------|----------------|------------|
| Free | 60 | 10,000 |
| Pro | 600 | 100,000 |
| Enterprise | 6,000 | Unlimited |

## Error Responses

All errors follow a consistent JSON format:

```json
{
  "error": "Human-readable error message",
  "code": "MACHINE_READABLE_CODE",
  "details": {}
}
```

Common HTTP status codes:
- `400` — Invalid request body or parameters
- `401` — Missing or invalid authentication token
- `403` — Insufficient permissions
- `404` — Resource not found
- `409` — Resource already exists
- `429` — Rate limit exceeded
- `500` — Internal server error
