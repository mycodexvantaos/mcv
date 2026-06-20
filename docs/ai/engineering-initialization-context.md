# MyCodexVantaOS AI Engineering Initialization Context

## 1. Repository Identity

Repository:

```text
ai-software-engineering-guild/mycodexvantaos
```

This repository is governed as a production-grade, auditable, long-lived engineering asset.

All AI engineering work must preserve:

```text
correctness
security
maintainability
auditability
deterministic CI/CD behavior
zero hardcoded secrets
environment consistency
```

---

## 2. Canonical GitHub Environments

The repository currently uses exactly these GitHub Environments:

```text
development
preview
production
github-pages
```

Do not create or reference non-canonical environments such as:

```text
dev
prod
stage
staging
test
qa
```

Unless explicitly requested through a governance decision.

---

## 3. Environment Deployment Rules

### development

Allowed deployment branch rules:

```text
main
develop
feature/*
fix/*
chore/*
```

Environment variables:

```text
APP_ENV=development
DEPLOY_ENV=development
LOG_LEVEL=debug
NODE_ENV=development
```

Secrets:

```text
none by default
```

---

### preview

Allowed deployment branch rules:

```text
main
develop
feature/*
fix/*
chore/*
preview/*
```

Environment variables:

```text
APP_ENV=preview
DEPLOY_ENV=preview
LOG_LEVEL=info
NODE_ENV=production
```

Secrets:

```text
none by default
```

Important:

```text
NODE_ENV must be production in preview because preview uses production build behavior.
```

---

### production

Allowed deployment branch rules:

```text
main
```

Environment variables:

```text
APP_ENV=production
DEPLOY_ENV=production
LOG_LEVEL=warn
NODE_ENV=production
```

Secrets:

```text
none by default
```

Important:

```text
Do not allow feature/*, fix/*, chore/*, preview/*, or develop to deploy to production.
Do not add v* tag deployment rules unless explicitly requested and implemented as a tag rule, not a branch rule.
```

---

### github-pages

Allowed deployment branch rules:

```text
main
```

Environment variables:

```text
none
```

Secrets:

```text
none
```

---

## 4. Repository Secrets and Variables Policy

Repository-level secrets and variables must not be used unless explicitly required.

Default repository-level state:

```text
Repository secrets: none
Repository variables: none
```

Never store secrets in GitHub Variables.

Forbidden examples:

```text
GH_TOKEN in variables
GITHUB_TOKEN in variables
NPM_TOKEN in variables
CLOUDFLARE_API_TOKEN in variables
PASSWORD in variables
SECRET in variables
```

Secrets must only be stored in:

```text
GitHub Secrets
environment-specific secrets
external secret managers
```

depending on deployment scope.

---

## 5. GitHub Actions Environment Usage

When a workflow targets an environment, use one of the canonical names only:

```yaml
environment: development
environment: preview
environment: production
environment: github-pages
```

Do not use:

```yaml
environment: dev
environment: prod
environment: staging
environment: test
```

unless a governance update explicitly introduces that environment.

---

## 6. Branch Strategy

Canonical branch/pattern vocabulary:

```text
main
develop
feature/*
fix/*
chore/*
preview/*
```

Production deployment source:

```text
main only
```

Preview deployment source:

```text
main, develop, feature/*, fix/*, chore/*, preview/*
```

Development deployment source:

```text
main, develop, feature/*, fix/*, chore/*
```

---

## 7. Required AI Engineering Behavior

For every engineering task, the AI engineering team must:

```text
1. Respect the canonical environment names.
2. Avoid creating new environment names unless explicitly requested.
3. Avoid introducing hardcoded secrets.
4. Avoid duplicating APP_ENV, DEPLOY_ENV, LOG_LEVEL, NODE_ENV at repository level if already environment-scoped.
5. Use environment-scoped configuration when deployment behavior differs by target.
6. Keep production restricted to main.
7. Keep preview NODE_ENV as production.
8. Keep github-pages minimal unless explicitly required.
9. Produce changes that are auditable, deterministic, and CI-compatible.
10. Preserve existing governance structure unless explicitly instructed otherwise.
```

---

## 8. Required Output Quality

All delivered code/configuration must be:

```text
complete
runnable
auditable
minimal but sufficient
secure by default
free from placeholder secrets
consistent with GitHub Actions environment governance
```

Do not provide partial snippets if a complete file is required.

Do not invent secret names or deployment targets without explicit requirement.

Do not weaken production restrictions.

Do not add broad permissions to GitHub Actions.

Do not skip tests, linting, security checks, or policy validation when modifying CI/CD.

---

## 9. Current Environment Summary

```text
development  → 1 protection rule, 4 variables
production   → 1 protection rule, 4 variables
preview      → 1 protection rule, 4 variables
github-pages → 1 protection rule, 0 variables
```

Canonical environments only:

```text
development
production
preview
github-pages
```

Removed / non-canonical environment:

```text
dev
```
