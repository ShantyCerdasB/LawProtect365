/**
 * @fileoverview Signature Error Factories - Convenience constructors for signature service errors
 * @summary Error factory functions for consistent error handling
 * @description Provides helper functions for creating consistent error instances with 
 * appropriate status codes, error codes, and messages for the signature service domain.
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
import { SignatureErrorCodes, type AnyErrorCode } from "./codes";

// ============================================================================
// ENVELOPE ERRORS
// ============================================================================

/**
 * Creates a NotFoundError for when an envelope was not found (404).
 */
export const envelopeNotFound = (details?: unknown) =>
  new NotFoundError("Envelope not found", SignatureErrorCodes.ENVELOPE_NOT_FOUND, details);

/**
 * Creates a ConflictError for when an envelope is already sent (409).
 */
export const envelopeAlreadySent = (details?: unknown) =>
  new ConflictError("Envelope already sent", SignatureErrorCodes.ENVELOPE_ALREADY_SENT, details);

/**
 * Creates a ConflictError for invalid envelope state transitions (409).
 */
export const invalidEnvelopeState = (details?: unknown) =>
  new ConflictError("Invalid envelope state", SignatureErrorCodes.ENVELOPE_INVALID_STATE, details);

/**
 * Creates a ConflictError for when an envelope has expired (409).
 */
export const envelopeExpired = (details?: unknown) =>
  new ConflictError("Envelope has expired", SignatureErrorCodes.ENVELOPE_EXPIRED, details);

/**
 * Creates a ConflictError for when an envelope is already completed (409).
 */
export const envelopeCompleted = (details?: unknown) =>
  new ConflictError("Envelope is already completed", SignatureErrorCodes.ENVELOPE_COMPLETED, details);

/**
 * Creates a ConflictError for when an envelope has been declined (409).
 */
export const envelopeDeclined = (details?: unknown) =>
  new ConflictError("Envelope has been declined", SignatureErrorCodes.ENVELOPE_DECLINED, details);

/**
 * Creates a TooManyRequestsError for when envelope limits are exceeded (429).
 */
export const envelopeLimitExceeded = (details?: unknown) =>
  new TooManyRequestsError("Envelope limit exceeded", SignatureErrorCodes.ENVELOPE_LIMIT_EXCEEDED, details);

/**
 * Creates a ConflictError for when envelope title is duplicate (409).
 */
export const envelopeTitleDuplicate = (details?: unknown) =>
  new ConflictError("Envelope title is duplicate", SignatureErrorCodes.ENVELOPE_TITLE_DUPLICATE, details);

/**
 * Creates a BadRequestError for invalid envelope expiration (400).
 */
export const envelopeExpirationInvalid = (details?: unknown) =>
  new BadRequestError("Envelope expiration is invalid", SignatureErrorCodes.ENVELOPE_EXPIRATION_INVALID, details);

/**
 * Creates a NotFoundError for when envelope document is not found (404).
 */
export const envelopeDocumentNotFound = (details?: unknown) =>
  new NotFoundError("Envelope document not found", SignatureErrorCodes.ENVELOPE_DOCUMENT_NOT_FOUND, details);

// ============================================================================
// SIGNER ERRORS
// ============================================================================

/**
 * Creates a NotFoundError for when a signer was not found (404).
 */
export const signerNotFound = (details?: unknown) =>
  new NotFoundError("Signer not found", SignatureErrorCodes.SIGNER_NOT_FOUND, details);

/**
 * Creates a ConflictError for when a signer has already signed (409).
 */
export const signerAlreadySigned = (details?: unknown) =>
  new ConflictError("Signer has already signed", SignatureErrorCodes.SIGNER_ALREADY_SIGNED, details);

/**
 * Creates a ConflictError for when a signer has already declined (409).
 */
export const signerAlreadyDeclined = (details?: unknown) =>
  new ConflictError("Signer has already declined", SignatureErrorCodes.SIGNER_ALREADY_DECLINED, details);

/**
 * Creates a ConflictError for invalid signer state (409).
 */
export const invalidSignerState = (details?: unknown) =>
  new ConflictError("Invalid signer state", SignatureErrorCodes.SIGNER_INVALID_STATE, details);

/**
 * Creates a BadRequestError for missing signer email (400).
 */
export const signerEmailRequired = (details?: unknown) =>
  new BadRequestError("Signer email is required", SignatureErrorCodes.SIGNER_EMAIL_REQUIRED, details);

/**
 * Creates a ConflictError for duplicate signer email (409).
 */
export const signerEmailDuplicate = (details?: unknown) =>
  new ConflictError("Signer email already exists in envelope", SignatureErrorCodes.SIGNER_EMAIL_DUPLICATE, details);

/**
 * Creates a ConflictError for when a signer cannot be removed (409).
 */
export const signerCannotBeRemoved = (details?: unknown) =>
  new ConflictError("Signer cannot be removed", SignatureErrorCodes.SIGNER_CANNOT_BE_REMOVED, details);

// ============================================================================
// SIGNATURE ERRORS
// ============================================================================

/**
 * Creates a NotFoundError for when a signature was not found (404).
 */
export const signatureNotFound = (details?: unknown) =>
  new NotFoundError("Signature not found", SignatureErrorCodes.SIGNATURE_NOT_FOUND, details);

/**
 * Creates an InternalError for signature operation failures (500).
 */
export const signatureFailed = (details?: unknown) =>
  new InternalError("Signature failed", SignatureErrorCodes.SIGNATURE_FAILED, details);

/**
 * Creates an UnprocessableEntityError for signature hash mismatches (422).
 */
export const signatureHashMismatch = (details?: unknown) =>
  new UnprocessableEntityError("Signature hash mismatch", SignatureErrorCodes.SIGNATURE_HASH_MISMATCH, details);


/**
 * Creates a ConflictError for when a signature already exists (409).
 */
export const signatureAlreadyExists = (details?: unknown) =>
  new ConflictError("Signature already exists", SignatureErrorCodes.SIGNATURE_ALREADY_EXISTS, details);

// ============================================================================
// KMS / CRYPTO ERRORS
// ============================================================================

/**
 * Creates a NotFoundError for KMS key not found (404).
 */
export const kmsKeyNotFound = (details?: unknown) =>
  new NotFoundError("KMS key not found", SignatureErrorCodes.KMS_KEY_NOT_FOUND, details);

/**
 * Creates a ForbiddenError for KMS permission denied (403).
 */
export const kmsPermissionDenied = (details?: unknown) =>
  new ForbiddenError("KMS permission denied", SignatureErrorCodes.KMS_PERMISSION_DENIED, details);

/**
 * Creates an InternalError for KMS signing failures (500).
 */
export const kmsSigningFailed = (details?: unknown) =>
  new InternalError("KMS signing failed", SignatureErrorCodes.KMS_SIGNING_FAILED, details);

/**
 * Creates an UnprocessableEntityError for KMS validation failures (422).
 */
export const kmsValidationFailed = (details?: unknown) =>
  new UnprocessableEntityError("KMS validation failed", SignatureErrorCodes.KMS_VALIDATION_FAILED, details);

// ============================================================================
// CONSENT & AUTHENTICATION ERRORS
// ============================================================================

/**
 * Creates a ForbiddenError for missing consent (403).
 */
export const consentRequired = (details?: unknown) =>
  new ForbiddenError("Consent required", SignatureErrorCodes.CONSENT_REQUIRED, details);

/**
 * Creates a ForbiddenError for consent not given (403).
 */
export const consentNotGiven = (details?: unknown) =>
  new ForbiddenError("Consent not given", SignatureErrorCodes.CONSENT_NOT_GIVEN, details);

/**
 * Creates a NotFoundError for consent not found (404).
 */
export const consentNotFound = (details?: unknown) =>
  new NotFoundError("Consent not found", SignatureErrorCodes.CONSENT_NOT_FOUND, details);

/**
 * Creates a BadRequestError for invalid consent (400).
 */
export const consentInvalid = (details?: unknown) =>
  new BadRequestError("Invalid consent", SignatureErrorCodes.CONSENT_INVALID, details);

/**
 * Creates a BadRequestError for missing consent timestamp (400).
 */
export const consentTimestampRequired = (details?: unknown) =>
  new BadRequestError("Consent timestamp is required for legal compliance", SignatureErrorCodes.CONSENT_TIMESTAMP_REQUIRED, details);

/**
 * Creates a BadRequestError for missing consent text (400).
 */
export const consentTextRequired = (details?: unknown) =>
  new BadRequestError("Consent text is required for legal compliance", SignatureErrorCodes.CONSENT_TEXT_REQUIRED, details);

/**
 * Creates a BadRequestError for missing IP address (400).
 */
export const consentIpRequired = (details?: unknown) =>
  new BadRequestError("IP address is required for legal compliance", SignatureErrorCodes.CONSENT_IP_REQUIRED, details);

/**
 * Creates a BadRequestError for missing user agent (400).
 */
export const consentUserAgentRequired = (details?: unknown) =>
  new BadRequestError("User agent is required for legal compliance", SignatureErrorCodes.CONSENT_USER_AGENT_REQUIRED, details);

/**
 * Creates an UnauthorizedError for invalid invitation token (401).
 */
export const invitationTokenInvalid = (details?: unknown) =>
  new UnauthorizedError("Invalid invitation token", SignatureErrorCodes.INVITATION_TOKEN_INVALID, details);

/**
 * Creates an UnauthorizedError for expired invitation token (401).
 */
export const invitationTokenExpired = (details?: unknown) =>
  new UnauthorizedError("Invitation token expired", SignatureErrorCodes.INVITATION_TOKEN_EXPIRED, details);

// ============================================================================
// DOCUMENT SERVICE INTEGRATION ERRORS
// ============================================================================

/**
 * Creates a NotFoundError for when a document was not found (404).
 */
export const documentNotFound = (details?: unknown) =>
  new NotFoundError("Document not found", SignatureErrorCodes.DOCUMENT_NOT_FOUND, details);

/**
 * Creates a ConflictError for when a document is not ready (409).
 */
export const documentNotReady = (details?: unknown) =>
  new ConflictError("Document is not ready for signing", SignatureErrorCodes.DOCUMENT_NOT_READY, details);

/**
 * Creates an UnprocessableEntityError for invalid document hash (422).
 */
export const documentInvalidHash = (details?: unknown) =>
  new UnprocessableEntityError("Document hash is invalid", SignatureErrorCodes.DOCUMENT_INVALID_HASH, details);

/**
 * Creates an InternalError for S3 document errors (500).
 */
export const documentS3Error = (details?: unknown) =>
  new InternalError("Document S3 error", SignatureErrorCodes.DOCUMENT_S3_ERROR, details);

// ============================================================================
// AUDIT & COMPLIANCE ERRORS
// ============================================================================

/**
 * Creates an InternalError for audit event failures (500).
 */
export const auditEventFailed = (details?: unknown) =>
  new InternalError("Audit event failed", SignatureErrorCodes.AUDIT_EVENT_FAILED, details);

/**
 * Creates a NotFoundError for when audit trail was not found (404).
 */
export const auditTrailNotFound = (details?: unknown) =>
  new NotFoundError("Audit trail not found", SignatureErrorCodes.AUDIT_TRAIL_NOT_FOUND, details);

// ============================================================================
// RATE LIMITING ERRORS
// ============================================================================

/**
 * Creates a TooManyRequestsError for envelope send rate limiting (429).
 */
export const rateLimitEnvelopeSend = (retryAfterSeconds = 60, details?: unknown) => {
  const err = new TooManyRequestsError(
    "Too Many Requests: envelope send rate limit",
    SignatureErrorCodes.RATE_LIMIT_ENVELOPE_SEND,
    details
  );
  (err as any).retryAfterSeconds = retryAfterSeconds;
  return err;
};

/**
 * Creates a TooManyRequestsError for signer invitation rate limiting (429).
 */
export const rateLimitSignerInvite = (retryAfterSeconds = 60, details?: unknown) => {
  const err = new TooManyRequestsError(
    "Too Many Requests: signer invitation limit",
    SignatureErrorCodes.RATE_LIMIT_SIGNER_INVITE,
    details
  );
  (err as any).retryAfterSeconds = retryAfterSeconds;
  return err;
};

/**
 * Creates a TooManyRequestsError for signature attempt rate limiting (429).
 */
export const rateLimitSignatureAttempt = (retryAfterSeconds = 60, details?: unknown) => {
  const err = new TooManyRequestsError(
    "Too Many Requests: signature attempt limit",
    SignatureErrorCodes.RATE_LIMIT_SIGNATURE_ATTEMPT,
    details
  );
  (err as any).retryAfterSeconds = retryAfterSeconds;
  return err;
};

// ============================================================================
// GENERIC ERROR HELPERS
// ============================================================================

/**
 * Creates a BadRequestError for validation errors (400).
 */
export const badRequest = (message: string, code: AnyErrorCode = SignatureErrorCodes.SIGNER_EMAIL_REQUIRED, details?: unknown) =>
  new BadRequestError(message, code, details);

/**
 * Creates an UnprocessableEntityError for semantically valid JSON that fails business rules (422).
 */
export const unprocessable = (message: string, code: AnyErrorCode, details?: unknown) =>
  new UnprocessableEntityError(message, code, details);

// ============================================================================
// SECURITY & ACCESS CONTROL ERRORS
// ============================================================================

/**
 * Creates a ForbiddenError for when access is denied (403).
 */
export const accessDenied = (details?: unknown) =>
  new ForbiddenError("Access denied", SignatureErrorCodes.ACCESS_DENIED, details);

/**
 * Creates a ForbiddenError for when IP address is blocked (403).
 */
export const ipAddressBlocked = (details?: unknown) =>
  new ForbiddenError("IP address is blocked", SignatureErrorCodes.IP_ADDRESS_BLOCKED, details);

/**
 * Creates a ForbiddenError for when user agent is blocked (403).
 */
export const userAgentBlocked = (details?: unknown) =>
  new ForbiddenError("User agent is blocked", SignatureErrorCodes.USER_AGENT_BLOCKED, details);

/**
 * Creates a UnauthorizedError for when access token is invalid (401).
 */
export const invalidAccessToken = (details?: unknown) =>
  new UnauthorizedError("Invalid access token", SignatureErrorCodes.INVALID_ACCESS_TOKEN, details);

/**
 * Creates a UnauthorizedError for when access token is expired (401).
 */
export const accessTokenExpired = (details?: unknown) =>
  new UnauthorizedError("Access token expired", SignatureErrorCodes.ACCESS_TOKEN_EXPIRED, details);

/**
 * Creates a ForbiddenError for when permission is denied (403).
 */
export const permissionDenied = (details?: unknown) =>
  new ForbiddenError("Permission denied", SignatureErrorCodes.PERMISSION_DENIED, details);

/**
 * Creates a TooManyRequestsError for when rate limit is exceeded (429).
 */
export const rateLimitExceeded = (details?: unknown) =>
  new TooManyRequestsError("Rate limit exceeded", SignatureErrorCodes.RATE_LIMIT_EXCEEDED, details);

/**
 * Creates a ForbiddenError for when suspicious activity is detected (403).
 */
export const suspiciousActivity = (details?: unknown) =>
  new ForbiddenError("Suspicious activity detected", SignatureErrorCodes.SUSPICIOUS_ACTIVITY, details);

/**
 * Creates a ForbiddenError for when geolocation is blocked (403).
 */
export const geolocationBlocked = (details?: unknown) =>
  new ForbiddenError("Geolocation is blocked", SignatureErrorCodes.GEOLOCATION_BLOCKED, details);

/**
 * Creates a ForbiddenError for when device is not trusted (403).
 */
export const deviceNotTrusted = (details?: unknown) =>
  new ForbiddenError("Device is not trusted", SignatureErrorCodes.DEVICE_NOT_TRUSTED, details);

// ============================================================================
// COMPLIANCE ERROR FACTORIES
// ============================================================================

/**
 * Creates a ForbiddenError for when compliance violation is detected (403).
 */
export const complianceViolation = (details?: unknown) =>
  new ForbiddenError("Compliance violation detected", SignatureErrorCodes.COMPLIANCE_VIOLATION, details);

/**
 * Creates a ForbiddenError for when audit trail is incomplete (403).
 */
export const auditTrailIncomplete = (details?: unknown) =>
  new ForbiddenError("Audit trail is incomplete or invalid", SignatureErrorCodes.AUDIT_TRAIL_INCOMPLETE, details);

/**
 * Creates a ForbiddenError for when document integrity violation is detected (403).
 */
export const documentIntegrityViolation = (details?: unknown) =>
  new ForbiddenError("Document integrity violation detected", SignatureErrorCodes.DOCUMENT_INTEGRITY_VIOLATION, details);

/**
 * Creates a ForbiddenError for when signature is invalid (403).
 */
export const signatureInvalid = (details?: unknown) =>
  new ForbiddenError("Signature is invalid or malformed", SignatureErrorCodes.SIGNATURE_INVALID, details);

// ============================================================================
// Workflow Errors
// ============================================================================

/**
 * Creates a BadRequestError for workflow violations (400).
 */
export const workflowViolation = (details?: unknown) =>
  new BadRequestError("Workflow rule violation", SignatureErrorCodes.WORKFLOW_VIOLATION, details);

/**
 * Creates a BadRequestError for invalid state transitions (400).
 */
export const invalidStateTransition = (details?: unknown) =>
  new BadRequestError("Invalid state transition", SignatureErrorCodes.INVALID_STATE_TRANSITION, details);

/**
 * Creates a BadRequestError for invalid signing order (400).
 */
export const invalidSigningOrder = (details?: unknown) =>
  new BadRequestError("Invalid signing order", SignatureErrorCodes.INVALID_SIGNING_ORDER, details);

/**
 * Creates an InternalError for event generation failures (500).
 */
export const eventGenerationFailed = (details?: unknown) =>
  new InternalError("Failed to generate workflow event", SignatureErrorCodes.EVENT_GENERATION_FAILED, details);
