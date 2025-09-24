/**
 * @fileoverview User Service Errors - Main export file for user service error handling
 * @summary Re-exports all error codes and factory functions
 * @description Centralized export point for all user service error handling utilities.
 * Import from this file to access error codes and factory functions.
 */

// Re-export error codes and types
export { UserErrorCodes, type UserErrorCode, type AnyErrorCode } from "./codes";

// Re-export all factory functions
export {
  // OAuth errors
  oauthProviderUnsupported,
  oauthLinkConflict,
  oauthAccountNotFound,
  oauthClaimsInsufficient,
  oauthTokenInvalid,
  oauthTokenExpired,
  
  // Account errors
  accountNotFound,
  accountInactive,
  accountSuspended,
  accountDeleted,
  accountAlreadyExists,
  accountCreationFailed,
  accountUpdateFailed,
  
  // MFA errors
  mfaRequired,
  mfaNotEnabled,
  mfaCodeInvalid,
  mfaEnrollmentConflict,
  mfaEnrollmentFailed,
  mfaDisableNotAllowed,
  
  // Token / JWT errors
  tokenInvalid,
  tokenExpired,
  tokenIssuerMismatch,
  tokenAudienceMismatch,
  
  // Session errors
  sessionRevoked,
  sessionNotFound,
  
  // Authorization errors
  accessDenied,
  roleInsufficient,
  scopeInsufficient,
  
  // Validation errors
  validationFailed,
  emailAlreadyVerified,
  emailMissing,
  nameMissing,
  
  // Rate limiting / Security errors
  rateLimitExceeded,
  suspiciousActivity,
  deviceNotTrusted,
  ipAddressBlocked
} from "./factories";
