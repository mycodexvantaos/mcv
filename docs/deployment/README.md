# MyCodexVantaOS Deployment Guide

## Production Deployment

**Canonical URL:** https://mycodexvantaos.com

All deployments MUST use https://mycodexvantaos.com as the canonical URL.
Vendor-generated URLs (*.vercel.app, *.pages.dev, etc.) MUST NOT be used as production canonical URLs.

## Supported Platforms

- Cloudflare Pages
- Google Cloud Run
- Google Kubernetes Engine
- Firebase Hosting
- Vercel (internal only, not as canonical URL)
- Netlify (internal only, not as canonical URL)

## Environment Variables

```env
APP_ENV=production
PUBLIC_CANONICAL_URL=https://mycodexvantaos.com
PUBLIC_API_URL=https://api.mycodexvantaos.com
```
