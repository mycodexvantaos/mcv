# Cloudflare Pages Integration for MyCodeXvantaOS

## 📋 Overview

This directory contains all configuration files and scripts for deploying MyCodeXvantaOS to Cloudflare Pages with automated CI/CD, security, and monitoring.

## 🚀 Quick Start

### 1. Configure GitHub Secrets

Add these secrets to your GitHub repository:

```bash
CLOUDFLARE_API_TOKEN=<redacted-cloudflare-token>
CLOUDFLARE_ACCOUNT_ID=<your-account-id>
CLOUDFLARE_ZONE_ID=<your-zone-id>
```

### 2. Deploy to Production

```bash
# Using the deployment script
./.cloudflare/deploy.sh production

# Or push to main branch (automatic deployment)
git push origin main
```

### 3. Deploy to Preview

```bash
# Using the deployment script
./.cloudflare/deploy.sh preview

# Or create a pull request (automatic preview deployment)
```

## 📁 File Structure

```
.cloudflare/
├── wrangler.toml              # Cloudflare Pages configuration
├── _middleware.ts             # Security middleware
├── api-adapter.ts             # API route adapter
├── types.ts                   # TypeScript definitions
├── access-policy.json         # Zero Trust access policy
├── deploy.sh                  # Deployment script
├── health-check.sh            # Health check script
├── dns-config.sh              # DNS configuration script
└── README.md                  # This file
```

## 🔧 Configuration Files

### wrangler.toml

Main Cloudflare Pages configuration file that defines:

- Project name and compatibility date
- Environment variables
- Environment-specific settings (production, preview, development)

### \_middleware.ts

Security middleware that handles:

- Security headers (CSP, HSTS, XSS protection)
- CORS configuration for API routes
- Request routing and filtering

### api-adapter.ts

Adapts Next.js API routes to Cloudflare Workers runtime:

- API route pattern matching
- Request/response handling
- Error handling and logging

### types.ts

TypeScript type definitions for Cloudflare Workers:

- Environment variables
- D1 database bindings
- Request/response types

### access-policy.json

Zero Trust access policy configuration:

- Authentication methods (Google, GitHub, Email)
- Role-based access control (Admin, Editor, Viewer)
- IP restrictions and session management

## 🚀 Deployment Scripts

### deploy.sh

Automated deployment script for Cloudflare Pages:

```bash
# Deploy to production
./.cloudflare/deploy.sh production

# Deploy to preview
./.cloudflare/deploy.sh preview

# Deploy to development
./.cloudflare/deploy.sh development
```

**Features:**

- Automatic dependency installation
- Next.js build optimization
- Wrangler CLI deployment
- Environment-specific configuration

### health-check.sh

Comprehensive health check script:

```bash
# Check production environment
./.cloudflare/health-check.sh production

# Check preview environment
./.cloudflare/health-check.sh preview
```

**Checks:**

- HTTP endpoint availability
- DNS resolution
- SSL certificate validity
- Response time monitoring

### dns-config.sh

Automated DNS configuration script:

```bash
# Configure DNS records
./.cloudflare/dns-config.sh
```

**Creates:**

- CNAME records for main domains
- Wildcard records for preview deployments
- API subdomain configuration

## 🌐 Deployment URLs

### Production Environment

- **Admin Dashboard**: https://admin.autoecoops.io
- **Main Dashboard**: https://dashboard.autoecoops.io
- **API Endpoint**: https://api.autoecoops.io

### Preview Environment

- **Preview URL**: https://preview.autoecoops.io

### Development Environment

- **Development URL**: https://dev.autoecoops.io

## 🔐 Security Features

### Zero Trust Access

- Multi-factor authentication support
- Role-based access control
- IP-based restrictions
- Session management

### Security Headers

- Content Security Policy (CSP)
- HTTP Strict Transport Security (HSTS)
- X-Frame-Options
- X-Content-Type-Options
- Referrer Policy

### CORS Configuration

- API route CORS handling
- Environment-specific origins
- Preflight request support

## 📊 Monitoring

### GitHub Actions

- Automated deployment workflows
- Build status notifications
- Deployment verification
- Health check integration

### Health Checks

- Endpoint availability monitoring
- DNS resolution checks
- SSL certificate validation
- Performance metrics

## 🔄 CI/CD Pipeline

### Production Deployment

Triggered by:

- Push to `main` branch
- Manual workflow dispatch

### Preview Deployment

Triggered by:

- Pull request creation/updates
- Manual workflow dispatch

### Deployment Steps

1. Checkout repository
2. Setup Node.js environment
3. Install dependencies
4. Run type checking and linting
5. Build Next.js application
6. Deploy to Cloudflare Pages
7. Run health checks
8. Send notifications

## 🛠️ Troubleshooting

### Deployment Fails

1. Check GitHub Actions logs
2. Verify Cloudflare credentials
3. Ensure build succeeds locally
4. Check environment variables

### DNS Issues

1. Verify DNS records in Cloudflare Dashboard
2. Check DNS propagation status
3. Confirm SSL certificates are valid
4. Run health check script

### Access Denied

1. Verify Zero Trust access policy
2. Check authentication methods
3. Confirm user roles and permissions
4. Review IP restrictions

## 📚 Additional Resources

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)
- [Zero Trust Documentation](https://developers.cloudflare.com/cloudflare-one/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

## 🆘 Support

For issues or questions:

1. Check the troubleshooting section
2. Review GitHub Actions logs
3. Consult Cloudflare documentation
4. Contact support team

## 📝 License

This configuration is part of MyCodeXvantaOS project.
