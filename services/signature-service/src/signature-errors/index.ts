/**
 * @fileoverview Signature Errors barrel export - Exports all signature service errors
 * @summary Centralized exports for signature service error handling
 * @description This barrel file exports all signature service error codes and factory functions
 * for consistent error handling throughout the application.
 */

// Error codes and types
export { 
  SignatureErrorCodes, 
  type SignatureErrorCode, 
  type AnyErrorCode 
} from './codes';

// Error factory functions
export {
  // Envelope errors
  envelopeNotFound,
  envelopeAlreadySent,
  invalidEnvelopeState,
  envelopeExpired,
  envelopeCompleted,
  envelopeDeclined,
  envelopeLimitExceeded,
  envelopeTitleDuplicate,
  envelopeExpirationInvalid,
  envelopeDocumentNotFound,

  // Signer errors
  signerNotFound,
  signerAlreadySigned,
  signerAlreadyDeclined,
  invalidSignerState,
  signerEmailRequired,
  signerEmailDuplicate,
  signerCannotBeRemoved,

  // Signature errors
  signatureNotFound,
  signatureFailed,
  signatureHashMismatch,
  signatureAlreadyExists,

  // KMS / Crypto errors
  kmsKeyNotFound,
  kmsPermissionDenied,
  kmsSigningFailed,
  kmsValidationFailed,

  // Consent & Authentication errors
  consentRequired,
  consentNotGiven,
  consentNotFound,
  consentInvalid,
  consentTimestampRequired,
  consentTextRequired,
  consentIpRequired,
  consentUserAgentRequired,
  invitationTokenInvalid,
  invitationTokenExpired,

  // Document Service Integration errors
  documentNotFound,
  documentNotReady,
  documentInvalidHash,
  documentS3Error,

  // Audit & Compliance errors
  auditEventFailed,
  auditTrailNotFound,

  // Rate limiting errors
  rateLimitEnvelopeSend,
  rateLimitSignerInvite,
  rateLimitSignatureAttempt,

  // Security & Access Control errors
  accessDenied,
  ipAddressBlocked,
  userAgentBlocked,
  invalidAccessToken,
  accessTokenExpired,
  permissionDenied,
  rateLimitExceeded,
  suspiciousActivity,
  geolocationBlocked,
  deviceNotTrusted,
  complianceViolation,
  auditTrailIncomplete,
  documentIntegrityViolation,
  signatureInvalid,

  // Workflow errors
  workflowViolation,
  invalidStateTransition,
  invalidSigningOrder,
  eventGenerationFailed,

  // Generic error helpers
  badRequest,
  unprocessable
} from './factories';
