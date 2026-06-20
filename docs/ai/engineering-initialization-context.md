# MyCodexVantaOS AI Engineering Initialization Context

Document version: `1.0.0`  
Status: `active`  
Scope: `GitHub Environments, CI/CD, deployment governance, AI engineering task initialization`  
Repository: `ai-software-engineering-guild/mycodexvantaos`

---

## 1. Repository Identity

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
least privilege
production safety
```

Any change that affects deployment, secrets, GitHub Actions, environment configuration, branch rules, or release behavior must follow this context.

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
uat
sandbox
release
```

Unless explicitly requested through a documented governance decision.

If a task appears to require a new environment, the AI engineering team must ask for confirmation before creating or referencing it.

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

Usage intent:

```text
development integration, early automation validation, internal non-production workflows
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

Usage intent:

```text
pull request previews, feature previews, release candidate validation, production-like build verification
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
Do not allow feature/*, fix/*, chore/*, preview/*, develop, or any non-main branch to deploy to production.
Do not add v* tag deployment rules unless explicitly requested and implemented as a tag rule, not a branch rule.
Do not weaken production restrictions.
```

Usage intent:

```text
stable production deployment only
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

Usage intent:

```text
GitHub Pages publication from main only
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
API_KEY in variables
PRIVATE_KEY in variables
ACCESS_TOKEN in variables
```

Secrets must only be stored in one of the following, depending on deployment scope:

```text
GitHub Secrets
environment-specific secrets
external secret managers
```

Do not invent secret names.

If a workflow requires a secret that does not exist, the AI engineering team must declare the required secret name and purpose, but must not provide fake secret values.

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
environment: stage
environment: test
environment: qa
environment: uat
```

unless a governance update explicitly introduces that environment.

Workflows must avoid ambiguous environment selection.

Production workflows must target:

```yaml
environment: production
```

only when the deployment source is restricted to `main`.

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

Do not introduce additional branch prefixes unless explicitly requested.

Examples that require explicit approval:

```text
release/*
hotfix/*
experiment/*
sandbox/*
staging/*
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
11. Ask for confirmation when requirements conflict with this context.
12. Avoid making assumptions about missing secrets, deployment providers, or release targets.
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
least-privilege by default
compatible with deterministic CI/CD
```

Do not provide partial snippets if a complete file is required.

Do not invent secret names or deployment targets without explicit requirement.

Do not weaken production restrictions.

Do not add broad permissions to GitHub Actions.

Do not skip tests, linting, security checks, or policy validation when modifying CI/CD.

Do not use unpinned third-party GitHub Actions in production-sensitive workflows unless a governance exception is approved.

---

## 9. GitHub Actions Permissions Policy

Workflows must use least-privilege permissions.

Default preferred permissions:

```yaml
permissions:
  contents: read
```

Only add additional permissions when strictly required.

Examples requiring justification:

```yaml
permissions:
  contents: write
  pages: write
  id-token: write
  pull-requests: write
  issues: write
  security-events: write
```

Do not use broad permissions such as:

```yaml
permissions: write-all
```

unless explicitly approved through a governance decision.

---

## 10. Third-Party GitHub Actions Policy

Third-party GitHub Actions must be pinned to immutable references where possible.

Preferred:

```yaml
uses: owner/action@<full_commit_sha>
```

Acceptable only with explicit governance approval:

```yaml
uses: owner/action@v1
uses: owner/action@v1.2.3
```

Forbidden for production-sensitive workflows:

```yaml
uses: owner/action@main
uses: owner/action@master
uses: owner/action@latest
```

---

## 11. Workflow Review Checklist

Any AI-generated workflow must verify:

```text
1. Canonical environment name is used.
2. Production deploys only from main.
3. Preview uses NODE_ENV=production.
4. No hardcoded secrets exist.
5. No secrets are stored as variables.
6. permissions are least-privilege.
7. Third-party actions are pinned or explicitly justified.
8. No non-canonical environment names are introduced.
9. No new branch patterns are introduced without approval.
10. CI/CD behavior is deterministic.
```

---

## 12. Current Environment Summary

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
