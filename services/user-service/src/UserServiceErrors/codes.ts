/**
 * @fileoverview User Service Error Codes - Domain-specific error codes for user service
 * @summary Error codes for user service domain operations
 * @description These codes complement the shared ErrorCodes catalog. Use them to keep
 * domain failures stable and machine-readable across logs, metrics and clients.
 */

import type { ErrorCode as SharedErrorCode } from "@lawprotect/shared-ts";

/**
 * Canonical error codes for the user domain.
 *
 * Keep codes stable once released; treat them as part of the public contract.
 */
export const UserErrorCodes = {
  // OAuth
  OAUTH_PROVIDER_UNSUPPORTED: "OAUTH_PROVIDER_UNSUPPORTED",
  OAUTH_LINK_CONFLICT: "OAUTH_LINK_CONFLICT",
  OAUTH_ACCOUNT_NOT_FOUND: "OAUTH_ACCOUNT_NOT_FOUND",
  OAUTH_CLAIMS_INSUFFICIENT: "OAUTH_CLAIMS_INSUFFICIENT",
  OAUTH_TOKEN_INVALID: "OAUTH_TOKEN_INVALID",
  OAUTH_TOKEN_EXPIRED: "OAUTH_TOKEN_EXPIRED",

  // Account
  ACCOUNT_NOT_FOUND: "ACCOUNT_NOT_FOUND",
  ACCOUNT_INACTIVE: "ACCOUNT_INACTIVE",
  ACCOUNT_SUSPENDED: "ACCOUNT_SUSPENDED",
  ACCOUNT_DELETED: "ACCOUNT_DELETED",
  ACCOUNT_ALREADY_EXISTS: "ACCOUNT_ALREADY_EXISTS",
  ACCOUNT_CREATION_FAILED: "ACCOUNT_CREATION_FAILED",
  ACCOUNT_UPDATE_FAILED: "ACCOUNT_UPDATE_FAILED",

  // MFA
  MFA_REQUIRED: "MFA_REQUIRED",
  MFA_NOT_ENABLED: "MFA_NOT_ENABLED",
  MFA_CODE_INVALID: "MFA_CODE_INVALID",
  MFA_ENROLLMENT_CONFLICT: "MFA_ENROLLMENT_CONFLICT",
  MFA_ENROLLMENT_FAILED: "MFA_ENROLLMENT_FAILED",
  MFA_DISABLE_NOT_ALLOWED: "MFA_DISABLE_NOT_ALLOWED",

  // Token / JWT
  TOKEN_INVALID: "TOKEN_INVALID",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  TOKEN_ISSUER_MISMATCH: "TOKEN_ISSUER_MISMATCH",
  TOKEN_AUDIENCE_MISMATCH: "TOKEN_AUDIENCE_MISMATCH",

  // Session
  SESSION_REVOKED: "SESSION_REVOKED",
  SESSION_NOT_FOUND: "SESSION_NOT_FOUND",

  // Authorization
  ACCESS_DENIED: "ACCESS_DENIED",
  ROLE_INSUFFICIENT: "ROLE_INSUFFICIENT",
  SCOPE_INSUFFICIENT: "SCOPE_INSUFFICIENT",

  // Validation
  VALIDATION_FAILED: "VALIDATION_FAILED",
  EMAIL_ALREADY_VERIFIED: "EMAIL_ALREADY_VERIFIED",
  EMAIL_MISSING: "EMAIL_MISSING",
  NAME_MISSING: "NAME_MISSING",

  // Rate limiting / Security
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  SUSPICIOUS_ACTIVITY: "SUSPICIOUS_ACTIVITY",
  DEVICE_NOT_TRUSTED: "DEVICE_NOT_TRUSTED",
  IP_ADDRESS_BLOCKED: "IP_ADDRESS_BLOCKED"
} as const;

/** Union of user-service specific code strings. */
export type UserErrorCode = keyof typeof UserErrorCodes;

/**
 * Union of any error code this service can emit:
 * - Shared catalog from @lawprotect/shared-ts
 * - User-service specific codes above
 */
export type AnyErrorCode = SharedErrorCode | UserErrorCode;
