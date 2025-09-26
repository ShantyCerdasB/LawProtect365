import type {  UserId, Brand } from "./brand.js";

/**
 * Resource identifiers used for permission modeling.
 * Extend per-domain as needed.
 */
export type Resource =
  | "document"
  | "case"
  | "user"
  | "payment"
  | "kyc"
  | "plan"
  | "subscription"
  | "report"
  | "notification";

/**
 * Actions applicable to resources.
 */
export type Action = "read" | "write" | "delete" | "approve" | "manage";

/**
 * Permission string in the form "resource:action".
 */
export type Permission = Brand<string, "Permission">;

/**
 * OAuth-style scope (string).
 */
export type Scope = Brand<string, "Scope">;

/**
 * Minimal resource reference for policy checks.
 */
export interface ResourceRef {
  /** Resource type being accessed. */
  resource: Resource;
  /** Concrete resource id (opaque, domain-defined). */
  id?: string;

}

/**
 * Security context available during authorization checks.
 * Typically derived from authentication middleware.
 */
export interface SecurityContext {
  userId: UserId;
  roles: string[];
  scopes?: Scope[];
  permissions?: Permission[];
  ipAddress: string;
  userAgent: string;
  country: string;
  accessType?: 'DIRECT' | 'INVITATION';
  tokenType?: 'JWT' | 'INVITATION';
  invitationToken?: string;
}

/**
 * Access request for a policy engine.
 */
export interface AccessRequest {
  subject: SecurityContext;
  resource: ResourceRef;
  action: Action;
}

/**
 * Authorization decision outcome.
 */
export interface PolicyDecision {
  effect: "allow" | "deny";
  reason?: string;
  constraints?: Record<string, string | number | boolean>;
}

/**
 * Network security context for event metadata and audit trails.
 * Contains network-level information without user authentication details.
 */
export interface NetworkSecurityContext {
  ipAddress?: string;
  userAgent?: string;
  country?: string;
}