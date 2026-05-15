# Cloudflare Runtime

## Overview

The Cloudflare runtime deploys services as Cloudflare Workers with bindings
to D1, KV, R2, Workers AI, and Vectorize.

## Supported Bindings

| Binding | Provider Package | Purpose |
|---|---|---|
| D1 | `@mycodexvantaos/provider-cloudflare-d1` | SQL database |
| KV | `@mycodexvantaos/provider-cloudflare-kv` | Key-value storage |
| R2 | `@mycodexvantaos/provider-cloudflare-r2` | Object storage |
| Workers AI | `@mycodexvantaos/provider-cloudflare-workers-ai` | LLM inference |
| Vectorize | `@mycodexvantaos/provider-cloudflare-vectorize` | Vector search |

## Deployment

```bash
# Deploy a service to Cloudflare
pnpm --filter @mycodexvantaos/cli deploy --runtime=cloudflare --service=identity

# Deploy all services
pnpm --filter @mycodexvantaos/cli deploy --runtime=cloudflare --all
```

## Important Note

Cloudflare is ONE runtime, not the core platform. The platform is designed
to be runtime-agnostic with Cloudflare as a first-class deployment target.
