# Changelog

All notable changes to `@mycodexvantaos/service-identity` are documented here.
This project adheres to [Semantic Versioning](https://semver.org/).

## [0.1.0] — Sprint 1 (in progress)

### Added — Story 1B-S1 (project initialization + storage layer)

- TypeScript project initialization: `tsconfig.json` (extends `tsconfig.base.json`).
- `src/index.ts` entry point with full type system:
  - `IdentitySubject`, `TokenClaims`, `Session`, `PolicyDecision`, `AuditEntry`.
  - `IdentityRole`, `SubjectStatus` enums derived from `identity.yaml` / `user.yaml`.
- Port interfaces:
  - `IIdentityPort` — mirrors `contracts/service-definitions/identity.yaml → spec.ports[0]` (4 methods: `validateToken`, `checkPermission`, `getSubject`, `resolveRole`).
  - `IEventBusPort` — minimal publish-only seam reserved for Sprint 3 Event Bus integration.
- In-memory storage layer (Local-first, zero external dependencies):
  - `Map<string, IdentitySubject>` for subjects.
  - `Map<string, CredentialRecord>` for PBKDF2 credentials (internal, never exported).
  - `Map<string, Session>` for active sessions.
  - SHA-256 hash-chained audit log (`appendAudit`, `verifyAuditIntegrity`, `getAuditChain`).
- Contract-derived constants mirrored inline (zero-dependency invariant):
  - `IDENTITY_CAPABILITIES`, `IDENTITY_EVENTS`, `IDENTITY_ROLES`, `SUBJECT_LIFECYCLE`.
- Capability function stubs for all 7 capabilities (throw `NotImplementedError` — to be implemented in Stories 1B-S2 and 1B-S3).
- `identityPort` adapter object exposing the `IIdentityPort` surface.
- `configure({ eventBus, signingKey })` runtime configuration hook.
- `reset()` test helper for deterministic unit tests.
- Introspection helpers: `getCapabilities`, `getEmittedEvents`, `getSubjectCount`, `getSessionCount`.
- `README.md` with full service documentation.
- Updated `package.json`: ESM (`type: module`), `main`/`types` → `src/index.ts`, scripts (`typecheck`, `lint`, `build`, `start`, `test`), fixed `service-service-catalog` → `service-catalog` dependency typo.

### Roadmap compliance

- Work items 1B-01 (project init), 1B-02 (IIdentityPort), 1B-03 (IdentitySubject types), 1B-04 (in-memory storage), 1B-13 (IEventBusPort), 1B-16 (README), 1B-17 (CHANGELOG) addressed.
- Dependencies limited to `@mycodexvantaos/core-kernel` + `@mycodexvantaos/service-catalog` per ROADMAP acceptance criteria.
