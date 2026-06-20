# Semantic Core Deployment Guide

## Quick Start

### 1. Start Services
```bash
docker-compose up -d
```

### 2. Access Services
- API: http://localhost:3001
- Backend: http://localhost:8000
- Prometheus: http://localhost:9090

## Production Deployment

### Build & Push
```bash
docker build -t semantic-core:latest .
docker push your-registry/semantic-core:latest
```

### Deploy
```bash
docker-compose up -d
```

## Monitoring
```bash
curl http://localhost:3001/health
curl http://localhost:3001/metrics
```
