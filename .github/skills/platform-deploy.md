# Skill: Platform Deployment

## Description

This skill enables Copilot to assist with deploying the mycodexvantaos platform to Cloudflare.

## Prerequisites

- Cloudflare account configured
- `wrangler` CLI authenticated
- Environment variables set in `.env` or Cloudflare dashboard

## Steps

1. **Pre-deployment validation**
   ```bash
   npm run typecheck
   npm run governance:check
   npm run contracts:validate
   ```

2. **Build for production**
   ```bash
   npm run build
   ```

3. **Preview deployment** (safe, non-production)
   ```bash
   npm run preview
   ```

4. **Production deployment** (requires explicit user approval)
   ```bash
   npm run deploy
   ```

## Rollback

If deployment fails or causes issues:
```bash
# List recent deployments
npx wrangler deployments list

# Rollback to previous version
npx wrangler rollback
```

## Notes

- Always run preview before production deployment
- Check Cloudflare dashboard for deployment status
- Monitor error rates after deployment
