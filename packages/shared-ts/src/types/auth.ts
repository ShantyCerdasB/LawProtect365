import type { TenantId, UserId } from "./brand.js";

/**
 * Enumerates platform roles used in RBAC checks.
 */
export type UserRole = "client" | "lawyer" | "admin" | "super_admin" | "system";

/**
 * Canonical JWT claims normalized for the platform.
 * Provider-specific fields are folded into these fields.
 */
export interface JwtClaims {
  /** Subject (user id). */
  sub: string;
  /** Token issuer URL. */
  iss: string;
  /** Audience (client id). */
  aud?: string | string[];
  /** Expiration (seconds since epoch). */
  exp?: number;
  /** Issued at (seconds since epoch). */
  iat?: number;
  /** JWT ID. */
  jti?: string;

  /** Email when available. */
  email?: string;
  /** Email verification flag when available. */
  emailVerified?: boolean;

  /** Tenant hint for multi-tenant scenarios. */
  tenantId?: string;
  /** Normalized roles (e.g., from cognito:groups). */
  roles?: string[];
  /** OAuth scopes as array. */
  scopes?: string[];

  /** Raw provider payload for auditing/debug. */
  raw: Record<string, unknown>;
}

/**
 * Options controlling JWT verification.
 */
export interface JwtVerifyOptions {
  /** Expected issuer; defaults to env JWT_ISSUER. */
  issuer?: string;
  /** Expected audience; defaults to env JWT_AUDIENCE. */
  audience?: string | string[];
  /** Explicit JWKS URI; defaults to `${issuer}/.well-known/jwks.json`. */
  jwksUri?: string;
  /** Clock skew tolerance in seconds (default 5). */
  clockToleranceSec?: number;
}

/**
 * Result of a successful JWT verification.
 */
export interface JwtVerificationResult {
  /** Protected header as parsed by JOSE. */
  header: Record<string, unknown>;
  /** Raw payload as received. */
  payload: Record<string, unknown>;
  /** Normalized claims. */
  claims: JwtClaims;
}

/**
 * Application principal resolved from claims and directory lookups.
 */
export interface Principal {
  userId: UserId;
  roles: UserRole[];
  tenantId?: TenantId;
  email?: string;
}

/**
 * Authentication context attached to API events by middleware.
 */
export interface AuthContext {
  /** Canonical user id suitable for business logic. */
  userId: UserId;
  /** Tenant boundary when applicable. */
  tenantId?: TenantId;
  /** Roles as received/normalized (not necessarily UserRole). */
  roles: string[];
  /** Scopes granted to the token. */
  scopes: string[];
  /** Optional permission strings resolved server-side. */
  permissions?: string[];
  /** Original claims for auditing. */
  rawClaims: Record<string, unknown>;
  /** Bearer token when propagated. */
  token?: string;
  /** Email when available. */
  email?: string;
}
