# Security Instructions

## Trust Boundaries

### Trusted Directories (Read/Write Allowed)

```
src/                    — Application source
packages/               — Shared packages
modules/                — Domain modules
services/               — Platform services
python/                 — Python plane
docs/                   — Documentation
tools/                  — Development tools
schemas/                — JSON schemas
contracts/              — Service contracts
.github/agents/         — Agent definitions
.github/instructions/   — Instruction files
.github/skills/         — Skill definitions
.agents/                — Platform skills
__tests__/              — Test files
```

### Restricted Directories (Read Only, Write Requires Approval)

```
infra/                  — Infrastructure as code
infra/secrets/          — Secrets management (NEVER write without approval)
.github/workflows/      — CI/CD workflows (review required)
.github/hooks/          — Hook configurations (review required)
.github/copilot/        — Copilot settings (review required)
config/                 — Application configuration files
```

### Forbidden Operations

| Operation                     | Reason                                 |
| ----------------------------- | -------------------------------------- |
| `rm -rf /`                    | System destruction                     |
| `rm -rf *`                    | Workspace destruction                  |
| `rm -rf ~`                    | Home directory destruction             |
| `git push --force`            | History rewriting                      |
| `git push --force-with-lease` | History rewriting (still dangerous)    |
| `curl \| sh`                  | Remote code execution                  |
| `curl \| bash`                | Remote code execution                  |
| `wget -O - \| sh`             | Remote code execution                  |
| `npm run deploy` (autonomous) | Production deployment without approval |
| `npm run upload` (autonomous) | Cloudflare upload without approval     |

## Credential Handling

### Environment Variables

- NEVER hardcode credentials in source files
- NEVER commit `.env` files (must be in `.gitignore`)
- Use `packages/security-secrets/` for secret management
- Reference secrets via environment variables only

### Patterns to Block

```
# These patterns in file writes should be blocked:
password=
api_key=
secret_key=
token=
AWS_SECRET_ACCESS_KEY=
GITHUB_TOKEN=
OPENAI_API_KEY=
DATABASE_URL=
```

### Safe Credential Patterns

```typescript
// CORRECT: Use environment variables
const apiKey = process.env.API_KEY;

// CORRECT: Use the secrets package
import { getSecret } from "@mycodexvantaos/security-secrets";
const secret = await getSecret("my-service-key");

// WRONG: Hardcoded credentials
const apiKey = "sk-abc123..."; // NEVER DO THIS
```

## Dependency Security

### Installing Packages

- Only install from npm registry (registry.npmjs.org)
- Never install from URLs, git repos, or tarballs without review
- Check package popularity and maintenance status
- Verify no known vulnerabilities: `npm audit`
- For Python: use `uv` and verify packages on PyPI

### Blocked Install Patterns

```bash
# BLOCKED:
npm install https://malicious.example.com/package.tgz
npm install git+https://unknown-repo.git
pip install https://untrusted.example.com/package.whl
curl https://install.example.com | sh
```

## Network Security

### Allowed Outbound Connections

- npm registry (registry.npmjs.org)
- GitHub API (api.github.com)
- Cloudflare API (api.cloudflare.com)
- PyPI (pypi.org)
- Google AI API (for Genkit)

### Blocked Patterns

- Arbitrary HTTP requests to unknown hosts
- WebSocket connections to untrusted servers
- DNS exfiltration attempts
- Reverse shell patterns

## Code Security Practices

### Input Validation

- Always validate user input at service boundaries
- Use `packages/security-validation/` for validation utilities
- Never trust data from external sources without validation
- Use Zod schemas for runtime type validation

### SQL/Query Safety

- Use parameterized queries (never string concatenation)
- Use the D1 client with prepared statements
- Validate all query parameters

### XSS Prevention

- Use React's built-in escaping (never `dangerouslySetInnerHTML`)
- Sanitize any user-generated content before rendering
- Use Content-Security-Policy headers

## Audit Trail

- All security-relevant operations should be logged
- Use `packages/audit-logger/` for audit logging
- Include: who, what, when, where, outcome
- Never log sensitive data (passwords, tokens, PII)
