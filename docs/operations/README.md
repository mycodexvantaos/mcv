# MyCodeXvantaOS Operations Guide

## Monitoring

### Health Checks

```bash
# API health
curl https://api.mycodexvantaos.ai/api/v1/health

# Response:
# { "status": "ok", "timestamp": "2024-01-01T00:00:00.000Z" }
```

### Audit Chain Integrity

```bash
# Verify the entire audit chain
curl -X POST https://api.mycodexvantaos.ai/api/v1/audit/verify

# Response:
# { "valid": true, "eventsVerified": 12345 }
```

## Backup & Recovery

### D1 Database (Cloudflare)

```bash
# Export D1 database
wrangler d1 export mycodexvantaos-db --output=backup.sql

# Import from backup
wrangler d1 execute mycodexvantaos-db --file=backup.sql
```

### PostgreSQL (Docker/K8s)

```bash
# Create backup
docker exec mycodexvantaos-postgres pg_dump -U mycodexvantaos mycodexvantaos > backup.sql

# Restore from backup
cat backup.sql | docker exec -i mycodexvantaos-postgres psql -U mycodexvantaos mycodexvantaos
```

### R2 / MinIO Object Storage

```bash
# R2 sync (using wrangler)
wrangler r2 object get mycodexvantaos-storage/<key>

# MinIO sync (using mc client)
mc alias set local http://localhost:9000 mycodexvantaos mycodexvantaos-secret
mc mirror local/mycodexvantaos-storage /backup/storage/
```

## Incident Response

### Service Unavailable

1. Check health endpoint: `GET /api/v1/health`
2. Verify infrastructure services are running
3. Check Cloudflare status page (for Workers deployment)
4. Review Worker logs: `wrangler tail`

### Audit Chain Broken

1. Run integrity verification: `POST /api/v1/audit/verify`
2. Identify the broken event in the response
3. Review the event payload for signs of tampering
4. Escalate to security team

### Rate Limit Exceeded

1. Check usage: `GET /api/v1/usage/{subjectId}`
2. Review workspace tier and quota limits
3. Consider upgrading tier or requesting quota increase

## Scaling

### Cloudflare Workers

Workers scale automatically. No manual intervention needed.

### Kubernetes

Adjust replica counts in values.yaml or use HPA:

```yaml
api:
  replicaCount: 3

hpa:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70
```
