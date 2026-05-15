# Kubernetes Runtime

## Overview

The Kubernetes runtime provides production-grade deployment with auto-scaling,
rolling updates, and service mesh integration.

## Helm Chart

```bash
# Install platform
helm install mycodexvantaos ./charts/mycodexvantaos

# Upgrade with custom values
helm upgrade mycodexvantaos ./charts/mycodexvantaos -f values-production.yaml
```

## Architecture

- **Ingress**: NGINX or Cloudflare Tunnel
- **TS Services**: Deployed as Deployments with HPA
- **Python Workers**: Deployed as Workers with KEDA scaling
- **Database**: Cloud SQL or in-cluster PostgreSQL
- **Cache**: Redis or Valkey
- **Object Storage**: MinIO or Cloud Storage

## Auto-Scaling

Python workers use KEDA for event-driven scaling based on job queue depth.
TS services use HPA based on CPU/memory metrics.
