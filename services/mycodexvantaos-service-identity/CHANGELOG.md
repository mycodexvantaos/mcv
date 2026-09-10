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

### Added — Story 1B-S2 (core authentication: register + authenticate)

- Web Crypto API password hashing: `hashPassword` (PBKDF2-SHA256, 600,000 iterations, 16-byte random salt) and `verifyPassword` (constant-time comparison via `timingSafeEqual`).
- Token signing via Web Crypto API: `signToken` (HMAC-SHA256, JWT-like `base64url(payload).base64url(signature)` format) and `verifyTokenSignature` (exported for testability).
- Base64URL and hex encoding helpers: `toHex`, `fromHex`, `toBase64Url`, `fromBase64Url` (typed as `Uint8Array<ArrayBuffer>` for TypeScript 5.9 + Web Crypto compatibility).
- `issueSession` internal helper: creates session record, signs access + refresh token pair, emits `identity.session.created`.
- `registerSubject` (auth.register): validates email/password/displayName, rejects duplicates (case-insensitive), hashes password, creates subject (`creating` → `active`), issues session + token pair, audit-logs, emits `identity.subject.registered`.
- `authenticateSubject` (auth.authenticate): looks up by email (case-insensitive), verifies password, rejects non-active subjects, issues session + token pair, emits `identity.subject.authenticated` or `identity.subject.authentication-failed`.
- 8 smoke tests covering register + authenticate happy paths and failure paths.

### Roadmap compliance (S2)

- Work items 1B-05 (auth.register), 1B-06 (auth.authenticate) addressed.
- Web Crypto API used for all password/token operations (Cloudflare Workers compatible). Audit hash-chain uses `node:crypto` (server-side integrity concern).

### Added — Story 1B-S3 (token management + RBAC + queries + lifecycle)

- `validateToken` (auth.validate-token): verifies HMAC signature, checks token type is `access`, checks expiry, checks session not revoked, returns `TokenClaims`.
- `revokeSession` (auth.revoke-session): marks session `revokedAt` (preserves audit trail), emits `identity.session.revoked`, idempotent for already-revoked sessions, returns `{ revoked: false }` for non-existent sessions.
- `checkPermission` (auth.check-permission): RBAC with `ROLE_PRECEDENCE` map (viewer=1, member/auditor/agent=2, owner=3, admin=4) and `ACTION_MIN_ROLE` map (read→viewer, write→member, delete→owner, admin→platform-admin). platform-admin bypasses all checks. Denies unknown actions. Checks subject status (must be `active` or `updating`). Audit-logs every decision.
- `resolveRole` (auth.resolve-role): returns workspace-scoped role override if present, otherwise platform role. Throws for non-existent subjects.
- `getSubject` (auth.get-subject): returns defensive copy (deep-copied `metadata` + `workspaceRoles`), no credential material, `null` if not found.
- `transitionSubjectStatus` (subject lifecycle): validates transitions via `VALID_TRANSITIONS` map, updates status + `updatedAt`, audit-logs, no-op if already in target state.
- `isValidTransition` (exported): pure function for transition validation.
- `assignWorkspaceRole` (exported): assigns workspace-scoped role override.
- `resolveEffectiveRole` (internal): shared role resolution logic used by both `checkPermission` and `resolveRole`.
- Removed `NotImplementedError` class (all stubs now implemented).
- 35 tests covering all 5 capabilities + lifecycle state machine + RBAC edge cases.

### Roadmap compliance (S3)

- Work items 1B-07 (validate-token), 1B-08 (revoke-session), 1B-09 (check-permission), 1B-10 (resolve-role), 1B-11 (get-subject), 1B-12 (lifecycle) addressed.

### Added — Story 1B-S4 (full test coverage + final validation)

- Extended test suite to 46 tests across 13 suites covering all 7 capabilities + lifecycle + token + RBAC + authentication failure paths + register validation + signing key reconfiguration.
- Coverage report: 94.97% lines, 91.53% branches, 91.67% functions on `src/index.ts` (exceeds ROADMAP ≥80% threshold).
- Final validation: typecheck ✅, lint 0 errors ✅, build ✅, 46/46 tests ✅, contract validation ✅, architecture validation ✅.

### Roadmap compliance (S4)

- Work items 1B-14 (audit logging — completed in S1), 1B-15 (unit tests — 46 tests covering all 7 capabilities, coverage ≥80%), 1B-18 (test script — completed in S1) addressed.
- All Track-B acceptance criteria met.
