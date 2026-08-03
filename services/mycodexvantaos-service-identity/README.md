# @mycodexvantaos/service-identity

**Identity Service** — platform-wide identity, authentication, and authorization.

This is the **Level 0** service in the MyCodeXvantaOS dependency graph. It has zero hard dependencies on any other service and is the root that every higher-level service (workspace, knowledge, search, etc.) depends on through the `IIdentityPort` seam.

## Architecture Invariants

| Invariant | How this service honors it |
|-----------|----------------------------|
| **Local-first** | Default storage is in-memory (`Map`). No network or DB call is required to boot or serve any capability. |
| **Provider-agnostic** | No SDK coupling. Password hashing and token signing use the global **Web Crypto API** (`crypto.subtle`), which runs identically on Node.js and Cloudflare Workers. |
| **Contract-first** | Every capability maps 1:1 to an entry in `contracts/service-definitions/identity.yaml`. The `IIdentityPort` interface mirrors `spec.ports[0]`. |
| **Governance-enforced** | All actions are audit-logged in a SHA-256 hash-chain (mirrors `service-audit-log`), satisfying `spec.audit.log_all_actions` + `integrity_chain`. |

## Capabilities (7)

| Capability ID | Method | Description |
|---------------|--------|-------------|
| `auth.register` | `registerSubject` | Register a new identity subject (email + password + display name) |
| `auth.authenticate` | `authenticateSubject` | Authenticate a subject and issue a token pair |
| `auth.validate-token` | `validateToken` | Validate an access token and return claims |
| `auth.revoke-session` | `revokeSession` | Revoke a session by session ID |
| `auth.check-permission` | `checkPermission` | RBAC permission check (subject × action × resource × workspace) |
| `auth.resolve-role` | `resolveRole` | Resolve the effective role for a subject in a workspace |
| `auth.get-subject` | `getSubject` | Get subject details by ID (no credential material) |

## IIdentityPort

The contract surface other services depend on (`contracts/service-definitions/identity.yaml → spec.ports[0]`):

```typescript
export interface IIdentityPort {
  validateToken(accessToken: string): Promise<TokenClaims>;
  checkPermission(
    subjectId: string,
    action: string,
    resourceUrn: string,
    workspaceId?: string | null,
  ): Promise<PolicyDecision>;
  getSubject(subjectId: string): Promise<IdentitySubject | null>;
  resolveRole(subjectId: string, workspaceId: string): Promise<IdentityRole>;
}
```

A ready-to-import adapter is exported as `identityPort`.

## IEventBusPort

A minimal publish-only seam reserved for Sprint 3 Event Bus integration. The service emits 5 events through this port when wired:

- `identity.subject.registered`
- `identity.subject.authenticated`
- `identity.subject.authentication-failed`
- `identity.session.created`
- `identity.session.revoked`

In Sprint 1 the port defaults to a no-op emitter. Use `configure({ eventBus })` to inject a real implementation.

## Runtime Modes

| Mode | Storage | Crypto | Status |
|------|---------|--------|--------|
| **Native (in-memory)** | `Map` (module-level) | Web Crypto API | ✅ Sprint 1 default |
| **Connected (Cloudflare)** | D1 (database) + KV (cache) | Web Crypto API | 🔜 Future Sprint (Provider adapter) |

## Subject Lifecycle

Per `contracts/resource-kinds/user.yaml`:

```
creating → active → updating → degraded → suspended → deleting → deleted
```

Use `transitionSubjectStatus(subjectId, target)` to advance a subject through the state machine. Invalid transitions throw.

## Roles (RBAC)

`platform-admin` · `workspace-owner` · `workspace-member` · `workspace-viewer` · `agent-service` · `auditor`

## Dependencies

Per the Level 0 invariant and ROADMAP acceptance criteria, the only declared dependencies are:

- `@mycodexvantaos/core-kernel` — Provider registry + capability interfaces
- `@mycodexvantaos/service-catalog` — Service catalog model

No runtime import of `@mycodexvantaos/contracts-sdk` is made; contract-derived constants (capability ids, event names, role enum, lifecycle states) are mirrored inline and documented against the contract to preserve the zero-dependency invariant.

## Usage

```typescript
import {
  registerSubject,
  authenticateSubject,
  validateToken,
  identityPort,
  configure,
  reset,
} from '@mycodexvantaos/service-identity';

// Register
const { subject, tokenPair } = await registerSubject({
  email: 'alice@example.com',
  password: 'supersecret',
  displayName: 'Alice',
});

// Authenticate
const auth = await authenticateSubject({
  email: 'alice@example.com',
  password: 'supersecret',
});

// Validate token
const claims = await validateToken(auth.tokenPair.accessToken);

// Use the port adapter
const decision = await identityPort.checkPermission(
  claims.subjectId,
  'read',
  'urn:mycodexvantaos:core:resource:workspace:ws-1',
  'ws-1',
);
```

## Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `typecheck` | `tsc --noEmit` | Type-check without emitting |
| `lint` | `eslint src/` | Lint source |
| `build` | `tsc` | Compile to `dist/` |
| `test` | `node --import tsx --test src/__tests__/identity.test.ts` | Run unit tests (Node.js built-in test runner) |

## Contract Source

- Service definition: `contracts/service-definitions/identity.yaml`
- Resource model: `contracts/resource-kinds/user.yaml`
- Service catalog: `contracts/service-definitions/service-catalog.yaml` (identity = Level 0)

## License

MIT
