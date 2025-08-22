````md
# `auth/` — Authentication & Authorization Toolkit (Hexagonal Guide)

Reusable **AuthN/AuthZ** building blocks for all microservices. Designed to fit a **hexagonal architecture**: controllers authenticate, use cases authorize, domain stays agnostic, and adapters avoid auth logic.

Import via:
```ts
import { ... } from "@lawprotect365/shared";
````

---

## Modules and Functions

### `roles.ts` — Role utilities

Normalize and evaluate user roles with a fixed hierarchy: `client < lawyer < admin < super_admin`.

* **`hasAtLeastRole(roles: string[], required: UserRole): boolean`**
  Returns `true` if any subject role meets or exceeds `required`.
  **Use for:** quick gate checks (e.g., admin-only flows).
* **`maxRole(roles: string[]): UserRole`**
  Returns the strongest normalized role (defaults to `"client"`).
  **Use for:** logging/metrics and coarse-grained decisions.
* **`hasRole(roles: string[], role: UserRole): boolean`**
  Exact membership check.
  **Use for:** specific feature toggles by role.
* **`toRole(value: string): UserRole | undefined`**
  Maps arbitrary strings to canonical roles (e.g., `"super-admin"` → `"super_admin"`, `"abogado"` → `"lawyer"`).
  **Use for:** normalizing provider claims or user input.
* **`normalizeRoles(roles: string[]): UserRole[]`**
  Converts and filters a list into canonical roles.
  **Use for:** sanitizing roles at the edge before policy checks.

### `scopes.ts` — OAuth2 scope helpers

Operate on space-delimited OAuth scope strings.

* **`parseScopes(scopeStr: string | undefined): string[]`**
  Splits `"read write"` → `["read","write"]`.
  **Use for:** turning raw JWT scope strings into arrays.
* **`hasAllScopes(available: string[] | undefined, required: string[]): boolean`**
  Ensures all required scopes are present.
  **Use for:** strict endpoints (e.g., write operations).
* **`hasAnyScope(available: string[] | undefined, anyOf: string[]): boolean`**
  Ensures at least one required scope is present.
  **Use for:** flexible read access or multi-permission alternatives.

### `access.ts` — Default access decision

A quick, opinionated authorization check.

* **`can(subject: SecurityContext, action: Action, resource: ResourceRef): boolean`**
  Decision model:

  * `super_admin` → allow all
  * `admin` → allow if same tenant
  * otherwise → require explicit `"resource:action"` in **permissions** or **scopes**
    **Use for:** lightweight yes/no checks in simple use cases.

### `policy.ts` — Composable authorization rules

Build explicit, diagnosable policies.

* **`type PolicyRule`**: `(subject, action, resource) => boolean | Promise<boolean>`
* **`class Policy`**

  * `.addRule(name, fn)` — register rule in order
  * `.evaluate(subject, action, resource)` — first “allow” wins, otherwise “deny” with reason
* **Built-ins**

  * `allowSuperAdmin`
  * `allowAdminSameTenant`
  * `allowPermissionOrScope`
    **Use for:** multi-rule scenarios (ownership, tenant checks, feature flags).

### `claims.ts` — Normalize JWT payloads

Convert raw provider payloads into canonical claims.

* **`toJwtClaims(payload: JWTPayload): JwtClaims`**
  Extracts: `sub`, `iss`, `aud`, `exp`, `iat`, `jti`, `email`, `emailVerified`, `roles`, `scopes`, `tenantId`, `raw`.
  **Use for:** consistent claims shape across providers (Cognito/Entra/Custom).

### `jwtVerifier.ts` — JWT utilities

Parse and verify tokens at the edge.

* **`bearerFromAuthHeader(header: string | null): string | undefined`**
  Extracts token from `"Authorization: Bearer <token>"`.
  **Use for:** controller middleware.
* **`verifyJwt(token: string, opts: JwtVerifyOptions): Promise<JwtVerificationResult>`**
  RS256 verification using remote JWKS (+ caching). Validates issuer, audience, expiry.
  **Use for:** centralized token verification before any business logic.

### `middleware.ts` — Auth wrapper for handlers

Edge middleware to protect controllers.

* **`withAuth(fn: HandlerFn, opts?: JwtVerifyOptions): HandlerFn`**
  Verifies JWT, attaches `evt.auth = { userId, tenantId, roles, scopes, permissions?, email, token, rawClaims }`.
  Returns 401 on failure using `ErrorCodes.AUTH_UNAUTHORIZED`.
  **Use for:** protecting endpoints with minimal boilerplate.

### `guard.ts` — Runtime assertions

Convenience guards for controllers/use cases.

* **`requireAuth(evt: ApiEvent): AuthContext`** → throws 401 if missing.
  **Use for:** ensure authenticated context exists.
* **`requireScopes(evt: ApiEvent, scopes: string[]): AuthContext`** → throws 403 if not all present.
  **Use for:** scope-gated endpoints.
* **`requirePermissions(evt: ApiEvent, perms: Permission[]): AuthContext`** → throws 403 if not all present.
  **Use for:** permission-gated endpoints.
* **`requireTenant(evt: ApiEvent, tenantId: string): AuthContext`** → throws 403 on mismatch.
  **Use for:** tenant isolation in multi-tenant flows.

---

## Hexagonal Architecture Placement

| Layer              | Recommended Usage                                                                                         | Modules                                                              |
| ------------------ | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| **Controllers**    | Authenticate at the edge, attach `auth`, perform quick guards, translate decisions → HTTP                 | `middleware.withAuth`, `guard.*`, `jwtVerifier.bearerFromAuthHeader` |
| **Use Cases**      | Evaluate authorization rules with subject context, prefer explicit policies or `can()`                    | `policy.Policy`, `allow*`, `access.can`, `roles.*`, `scopes.*`       |
| **Domain**         | **No auth logic**. Keep entities and rules independent of roles/scopes/tenants                            | —                                                                    |
| **Adapters/Infra** | Do not verify tokens here. Optionally support policy rules that need data (via ports queried in use case) | —                                                                    |

**Guidelines**

* Build `SecurityContext` in the controller (from `evt.auth`) and pass it **as an argument** to use cases.
* Use `Policy` for multi-rule/diagnosable decisions; use `can()` for simple checks.
* Keep domain pure; never embed role/scope checks inside entities.

---

## Example: Protected controller

```ts
import { withAuth, requireScopes, can } from "@lawprotect365/shared/auth";
import type { HandlerFn } from "@lawprotect365/shared/http";

export const handler: HandlerFn = withAuth(async (evt) => {
  const auth = requireScopes(evt, ["envelope:read"]);
  const allowed = can(auth, "delete", { resource: "envelope", tenantId: auth.tenantId, id: "env_123" });
  if (!allowed) return { statusCode: 403, body: "Forbidden" };
  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
});
```

## Example: Policy in a use case

```ts
import { Policy, allowSuperAdmin, allowAdminSameTenant, allowPermissionOrScope } from "@lawprotect365/shared/auth";
import type { SecurityContext, ResourceRef, Action } from "@lawprotect365/shared/types";

const policy = new Policy()
  .addRule("super_admin_all", allowSuperAdmin)
  .addRule("admin_same_tenant", allowAdminSameTenant)
  .addRule("perm_or_scope", allowPermissionOrScope);

export async function cancelEnvelope(
  subject: SecurityContext,
  resource: ResourceRef // { resource: "envelope", tenantId, id }
): Promise<boolean> {
  const decision = await policy.evaluate(subject, "cancel" as Action, resource);
  return decision.effect === "allow";
}
```

---

## Environment

Configure at deployment (resolved in your service `config/`):

* `JWT_ISSUER`, `JWT_AUDIENCE`
* `JWKS_URI` (optional; defaults to `/.well-known/jwks.json`)
* `JWKS_CACHE_SECONDS` (default `600`)

JWT verification is cached and tolerant to small clock skews.

---

## Testing Tips

* Controller tests: exercise `withAuth` success/failure paths and `guard.*` behaviors.
* Use-case tests: pass simple `SecurityContext` objects; test `Policy` sequences and `can()` outcomes.
* Domain tests: no auth dependencies.

---

```
```
