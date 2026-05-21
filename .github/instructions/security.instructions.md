# Security Instructions

## Trusted Directories

The following directories are trusted for read/write operations:

- `src/` — Application source code
- `packages/` — Monorepo packages
- `services/` — Platform services
- `docs/` — Documentation
- `__tests__/` — Test files
- `tools/` — Development tools and scripts

## Restricted Directories

The following directories require explicit user approval before modification:

- `infra/` — Infrastructure as code (may contain sensitive configurations)
- `.github/workflows/` — CI/CD pipelines
- `config/` — Application configuration files

## Forbidden Operations

The agent MUST NEVER perform these actions autonomously:

- `rm -rf` on any directory outside of `node_modules/` or build output
- `git push --force` on any branch
- `npm run deploy` or `npm run upload` (production deployment)
- Modifying `.env` files or any file containing secrets
- Installing packages from URLs (only named packages from npm registry)
- Running `curl | sh` or similar patterns

## Credential Handling

- Never log, print, or commit API keys, tokens, or passwords
- Use environment variables for all credentials
- Reference `SECURITY.md` for the project's security policy
- Report any accidentally exposed credentials immediately

## Dependency Security

- Only install packages from the official npm registry
- Check for known vulnerabilities before adding new dependencies
- Prefer well-maintained packages with active communities
- Run `npm audit` after adding new dependencies
