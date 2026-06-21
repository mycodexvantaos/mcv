# Skill: Platform Deployment

## Description

This skill enables Copilot to assist with deploying the MyCodeXvantaOS platform to Cloudflare. Deployment is a restricted operation that requires explicit user approval.

## Prerequisites

- Cloudflare account configured
- `wrangler` CLI authenticated (`npx wrangler login`)
- Environment variables set in Cloudflare dashboard
- All validation checks passing

## Pre-Deployment Validation (REQUIRED)

All of these MUST pass before any deployment:

```bash
# TypeScript compilation
npm run typecheck

# Code formatting
npm run format:check

# Governance compliance
npm run governance:check

# Contract validation
npm run contracts:validate

# Service tests
npm run test:services

# Contract tests
npm run test:contracts

# Release candidate verification
npm run rc:verify
```

For Python components:

```bash
npm run python:lint
npm run python:typecheck
npm run python:test
```

## Deployment Steps

### 1. Preview Deployment (Safe, Non-Production)

```bash
# Build and preview locally
npm run preview
```

This builds with OpenNext for Cloudflare and starts a local preview. Verify functionality before proceeding.

### 2. Production Deployment (REQUIRES USER APPROVAL)

⚠️ **This step MUST NOT be executed autonomously. Always ask for user confirmation.**

```bash
# Build and deploy to Cloudflare
npm run deploy
```

### 3. Post-Deployment Verification

```bash
# List recent deployments
npx wrangler deployments list

# Check deployment status
npx wrangler tail  # Live logs

# Verify health endpoint
curl https://<your-domain>/api/health
```

## Rollback

If deployment causes issues:

```bash
# List deployments to find previous version
npx wrangler deployments list

# Rollback to previous version
npx wrangler rollback
```

## Release Process (Full)

For formal releases:

```bash
# 1. Verify release candidate
npm run rc:verify

# 2. Soak testing
npm run rc:soak

# 3. Evaluate promotion criteria
npm run release:promotion:evaluate

# 4. Generate release artifacts
npm run release:artifacts

# 5. Generate SBOM
npm run release:sbom

# 6. Generate provenance
npm run release:provenance

# 7. Sign provenance
npm run release:sign

# 8. Generate release manifest
npm run generate-release-manifest

# 9. Deploy (with user approval)
npm run deploy
```

## Cloudflare Services

| Service | Purpose             | Management        |
| ------- | ------------------- | ----------------- |
| Workers | Application runtime | `wrangler` CLI    |
| D1      | SQL database        | `wrangler d1`     |
| KV      | Key-value store     | `wrangler kv`     |
| R2      | Object storage      | `wrangler r2`     |
| Queues  | Message queues      | `wrangler queues` |

## Migration Management

```bash
# Verify D1 migrations
npm run migration:verify:d1

# Verify SQLite migrations
npm run migration:verify:sqlite
```

## Notes

- Always run preview before production deployment
- Check Cloudflare dashboard for deployment status
- Monitor error rates after deployment
- Keep rollback plan ready for 24 hours post-deploy
- Document any deployment issues in `docs/adr/`
