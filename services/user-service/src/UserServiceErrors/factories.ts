/**
 * @fileoverview User Service Error Factories - Convenience constructors for user service errors
 * @summary Error factory functions for consistent error handling
 * @description Provides helper functions for creating consistent error instances with 
 * appropriate status codes, error codes, and messages for the user service domain.
 */

import { 
  BadRequestError,
  ConflictError,
  ForbiddenError,
  InternalError,
  NotFoundError,
  TooManyRequestsError,
  UnauthorizedError,
  UnprocessableEntityError
} from "@lawprotect/shared-ts";
import { UserErrorCodes } from "./codes";

// ============================================================================
// OAUTH ERRORS
// ============================================================================

/**
 * Creates a BadRequestError for unsupported OAuth provider (400).
 * @param details - Optional additional error details
 * @returns BadRequestError instance
 */
export const oauthProviderUnsupported = (details?: unknown) =>
  new BadRequestError("OAuth provider unsupported", UserErrorCodes.OAUTH_PROVIDER_UNSUPPORTED, details);

/**
 * Creates a ConflictError for OAuth account already linked to another user (409).
 * @param details - Optional additional error details
 * @returns ConflictError instance
 */
export const oauthLinkConflict = (details?: unknown) =>
  new ConflictError("OAuth account already linked to another user", UserErrorCodes.OAUTH_LINK_CONFLICT, details);

/**
 * Creates a NotFoundError for OAuth account not found (404).
 * @param details - Optional additional error details
 * @returns NotFoundError instance
 */
export const oauthAccountNotFound = (details?: unknown) =>
  new NotFoundError("OAuth account not found", UserErrorCodes.OAUTH_ACCOUNT_NOT_FOUND, details);

/**
 * Creates an UnprocessableEntityError for insufficient OAuth claims (422).
 * @param details - Optional additional error details
 * @returns UnprocessableEntityError instance
 */
export const oauthClaimsInsufficient = (details?: unknown) =>
  new UnprocessableEntityError("OAuth claims insufficient", UserErrorCodes.OAUTH_CLAIMS_INSUFFICIENT, details);

/**
 * Creates an UnauthorizedError for invalid OAuth token (401).
 * @param details - Optional additional error details
 * @returns UnauthorizedError instance
 */
export const oauthTokenInvalid = (details?: unknown) =>
  new UnauthorizedError("OAuth token invalid", UserErrorCodes.OAUTH_TOKEN_INVALID, details);

/**
 * Creates an UnauthorizedError for expired OAuth token (401).
 * @param details - Optional additional error details
 * @returns UnauthorizedError instance
 */
export const oauthTokenExpired = (details?: unknown) =>
  new UnauthorizedError("OAuth token expired", UserErrorCodes.OAUTH_TOKEN_EXPIRED, details);

// ============================================================================
// ACCOUNT ERRORS
// ============================================================================

/**
 * Creates a NotFoundError for when an account was not found (404).
 * @param details - Optional additional error details
 * @returns NotFoundError instance
 */
export const accountNotFound = (details?: unknown) =>
  new NotFoundError("Account not found", UserErrorCodes.ACCOUNT_NOT_FOUND, details);

/**
 * Creates a ForbiddenError for when an account is inactive (403).
 * @param details - Optional additional error details
 * @returns ForbiddenError instance
 */
export const accountInactive = (details?: unknown) =>
  new ForbiddenError("Account is inactive", UserErrorCodes.ACCOUNT_INACTIVE, details);

/**
 * Creates a ForbiddenError for when an account is suspended (403).
 * @param details - Optional additional error details
 * @returns ForbiddenError instance
 */
export const accountSuspended = (details?: unknown) =>
  new ForbiddenError("Account is suspended", UserErrorCodes.ACCOUNT_SUSPENDED, details);

/**
 * Creates a ForbiddenError for when an account is deleted (403).
 * @param details - Optional additional error details
 * @returns ForbiddenError instance
 */
export const accountDeleted = (details?: unknown) =>
  new ForbiddenError("Account is deleted", UserErrorCodes.ACCOUNT_DELETED, details);

/**
 * Creates a ConflictError for when an account already exists (409).
 * @param details - Optional additional error details
 * @returns ConflictError instance
 */
export const accountAlreadyExists = (details?: unknown) =>
  new ConflictError("Account already exists", UserErrorCodes.ACCOUNT_ALREADY_EXISTS, details);

/**
 * Creates an InternalError for when account creation fails (500).
 * @param details - Optional additional error details
 * @returns InternalError instance
 */
export const accountCreationFailed = (details?: unknown) =>
  new InternalError("Account creation failed", UserErrorCodes.ACCOUNT_CREATION_FAILED, details);

/**
 * Creates an InternalError for when account update fails (500).
 * @param details - Optional additional error details
 * @returns InternalError instance
 */
export const accountUpdateFailed = (details?: unknown) =>
  new InternalError("Account update failed", UserErrorCodes.ACCOUNT_UPDATE_FAILED, details);

// ============================================================================
// MFA ERRORS
// ============================================================================

/**
 * Creates a ForbiddenError for when MFA is required (403).
 * @param details - Optional additional error details
 * @returns ForbiddenError instance
 */
export const mfaRequired = (details?: unknown) =>
  new ForbiddenError("MFA required", UserErrorCodes.MFA_REQUIRED, details);

/**
 * Creates a BadRequestError for when MFA is not enabled (400).
 * @param details - Optional additional error details
 * @returns BadRequestError instance
 */
export const mfaNotEnabled = (details?: unknown) =>
  new BadRequestError("MFA not enabled", UserErrorCodes.MFA_NOT_ENABLED, details);

/**
 * Creates an UnauthorizedError for invalid MFA code (401).
 * @param details - Optional additional error details
 * @returns UnauthorizedError instance
 */
export const mfaCodeInvalid = (details?: unknown) =>
  new UnauthorizedError("MFA code invalid", UserErrorCodes.MFA_CODE_INVALID, details);

/**
 * Creates a ConflictError for MFA enrollment conflict (409).
 * @param details - Optional additional error details
 * @returns ConflictError instance
 */
export const mfaEnrollmentConflict = (details?: unknown) =>
  new ConflictError("MFA enrollment conflict", UserErrorCodes.MFA_ENROLLMENT_CONFLICT, details);

/**
 * Creates an InternalError for MFA enrollment failure (500).
 * @param details - Optional additional error details
 * @returns InternalError instance
 */
export const mfaEnrollmentFailed = (details?: unknown) =>
  new InternalError("MFA enrollment failed", UserErrorCodes.MFA_ENROLLMENT_FAILED, details);

/**
 * Creates a ForbiddenError for when MFA disable is not allowed (403).
 * @param details - Optional additional error details
 * @returns ForbiddenError instance
 */
export const mfaDisableNotAllowed = (details?: unknown) =>
  new ForbiddenError("MFA disable not allowed", UserErrorCodes.MFA_DISABLE_NOT_ALLOWED, details);

// ============================================================================
// TOKEN / JWT ERRORS
// ============================================================================

/**
 * Creates an UnauthorizedError for invalid token (401).
 * @param details - Optional additional error details
 * @returns UnauthorizedError instance
 */
export const tokenInvalid = (details?: unknown) =>
  new UnauthorizedError("Token invalid", UserErrorCodes.TOKEN_INVALID, details);

/**
 * Creates an UnauthorizedError for expired token (401).
 * @param details - Optional additional error details
 * @returns UnauthorizedError instance
 */
export const tokenExpired = (details?: unknown) =>
  new UnauthorizedError("Token expired", UserErrorCodes.TOKEN_EXPIRED, details);

/**
 * Creates an UnauthorizedError for token issuer mismatch (401).
 * @param details - Optional additional error details
 * @returns UnauthorizedError instance
 */
export const tokenIssuerMismatch = (details?: unknown) =>
  new UnauthorizedError("Token issuer mismatch", UserErrorCodes.TOKEN_ISSUER_MISMATCH, details);

/**
 * Creates an UnauthorizedError for token audience mismatch (401).
 * @param details - Optional additional error details
 * @returns UnauthorizedError instance
 */
export const tokenAudienceMismatch = (details?: unknown) =>
  new UnauthorizedError("Token audience mismatch", UserErrorCodes.TOKEN_AUDIENCE_MISMATCH, details);

// ============================================================================
// SESSION ERRORS
// ============================================================================

/**
 * Creates an UnauthorizedError for revoked session (401).
 * @param retryAfterSeconds - Optional retry after seconds for rate limiting
 * @param details - Optional additional error details
 * @returns UnauthorizedError instance
 */
export const sessionRevoked = (retryAfterSeconds?: number, details?: unknown) => {
  const err = new UnauthorizedError("Session revoked", UserErrorCodes.SESSION_REVOKED, details);
  if (retryAfterSeconds !== undefined) {
    (err as any).retryAfterSeconds = retryAfterSeconds;
  }
  return err;
};

/**
 * Creates a NotFoundError for when a session was not found (404).
 * @param details - Optional additional error details
 * @returns NotFoundError instance
 */
export const sessionNotFound = (details?: unknown) =>
  new NotFoundError("Session not found", UserErrorCodes.SESSION_NOT_FOUND, details);

// ============================================================================
// AUTHORIZATION ERRORS
// ============================================================================

/**
 * Creates a ForbiddenError for access denied (403).
 * @param details - Optional additional error details
 * @returns ForbiddenError instance
 */
export const accessDenied = (details?: unknown) =>
  new ForbiddenError("Access denied", UserErrorCodes.ACCESS_DENIED, details);

/**
 * Creates a ForbiddenError for insufficient role (403).
 * @param details - Optional additional error details
 * @returns ForbiddenError instance
 */
export const roleInsufficient = (details?: unknown) =>
  new ForbiddenError("Role insufficient", UserErrorCodes.ROLE_INSUFFICIENT, details);

/**
 * Creates a ForbiddenError for insufficient scope (403).
 * @param details - Optional additional error details
 * @returns ForbiddenError instance
 */
export const scopeInsufficient = (details?: unknown) =>
  new ForbiddenError("Scope insufficient", UserErrorCodes.SCOPE_INSUFFICIENT, details);

// ============================================================================
// VALIDATION ERRORS
// ============================================================================

/**
 * Creates a BadRequestError for validation failures (400).
 * @param message - The validation error message
 * @param details - Optional additional error details
 * @returns BadRequestError instance
 */
export const validationFailed = (message: string, details?: unknown) =>
  new BadRequestError(message, UserErrorCodes.VALIDATION_FAILED, details);

/**
 * Creates a ConflictError for when email is already verified (409).
 * @param details - Optional additional error details
 * @returns ConflictError instance
 */
export const emailAlreadyVerified = (details?: unknown) =>
  new ConflictError("Email already verified", UserErrorCodes.EMAIL_ALREADY_VERIFIED, details);

/**
 * Creates a BadRequestError for missing email (400).
 * @param details - Optional additional error details
 * @returns BadRequestError instance
 */
export const emailMissing = (details?: unknown) =>
  new BadRequestError("Email missing", UserErrorCodes.EMAIL_MISSING, details);

/**
 * Creates a BadRequestError for missing name (400).
 * @param details - Optional additional error details
 * @returns BadRequestError instance
 */
export const nameMissing = (details?: unknown) =>
  new BadRequestError("Name missing", UserErrorCodes.NAME_MISSING, details);

// ============================================================================
// RATE LIMITING / SECURITY ERRORS
// ============================================================================

/**
 * Creates a TooManyRequestsError for rate limit exceeded (429).
 * @param retryAfterSeconds - Optional retry after seconds for rate limiting
 * @param details - Optional additional error details
 * @returns TooManyRequestsError instance
 */
export const rateLimitExceeded = (retryAfterSeconds?: number, details?: unknown) => {
  const err = new TooManyRequestsError("Rate limit exceeded", UserErrorCodes.RATE_LIMIT_EXCEEDED, details);
  if (retryAfterSeconds !== undefined) {
    (err as any).retryAfterSeconds = retryAfterSeconds;
  }
  return err;
};

/**
 * Creates a ForbiddenError for suspicious activity (403).
 * @param details - Optional additional error details
 * @returns ForbiddenError instance
 */
export const suspiciousActivity = (details?: unknown) =>
  new ForbiddenError("Suspicious activity detected", UserErrorCodes.SUSPICIOUS_ACTIVITY, details);

/**
 * Creates a ForbiddenError for untrusted device (403).
 * @param details - Optional additional error details
 * @returns ForbiddenError instance
 */
export const deviceNotTrusted = (details?: unknown) =>
  new ForbiddenError("Device not trusted", UserErrorCodes.DEVICE_NOT_TRUSTED, details);

/**
 * Creates a ForbiddenError for blocked IP address (403).
 * @param details - Optional additional error details
 * @returns ForbiddenError instance
 */
export const ipAddressBlocked = (details?: unknown) =>
  new ForbiddenError("IP address blocked", UserErrorCodes.IP_ADDRESS_BLOCKED, details);
