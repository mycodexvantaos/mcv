# CODEX.md — OpenAI Codex Agent Instructions

## Project Overview

MyCodeXvantaOS is a Local-first, Provider-agnostic, Contract-driven full-stack application operating system. This file provides instructions for OpenAI Codex and compatible agents.

## Core Principles

1. **Local-first**: All capabilities must have native local implementations. Never introduce external-only dependencies.
2. **Provider-agnostic**: Use Provider abstraction interfaces. Never import third-party SDKs directly in business logic.
3. **Contract-first**: Define interfaces before implementation. Validate with `npm run contracts:validate`.
4. **Governance-enforced**: All rules enforced by CI. Run `npm run governance:check` before finalizing.

## Essential Commands

```bash
# Validation (run before every commit)
npm run typecheck
npm run format:check
npm run governance:check

# Testing
npm run test:services
npm run test:contracts
npm run python:test

# Development
npm run dev              # Next.js dev server (port 9002)
npm run genkit:dev       # Genkit AI dev server
npm run api:start        # API server

# Python
npm run python:lint
npm run python:typecheck
```

## Code Standards

- TypeScript strict mode everywhere
- Functional components (React)
- Conventional commits: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`
- Naming: `mycodexvantaos-<domain>-<capability>`
- JSDoc for all public APIs
- Provider pattern for external services

## Directory Layout

- `src/` — Next.js app source
- `packages/` — 70+ shared packages
- `modules/` — 20+ domain modules
- `services/` — 40+ microservices
- `python/` — Python plane (FastAPI, uv)
- `infra/` — Infrastructure as code
- `tools/` — Governance, migrations, generators
- `.github/` — CI/CD, agents, hooks, instructions
- `.agents/` — Skills and workflows

## Constraints

- Never force push
- Never deploy without approval
- Never bypass governance
- Never add dependencies without justification
- Always validate contracts after interface changes
- Always run typecheck before committing
