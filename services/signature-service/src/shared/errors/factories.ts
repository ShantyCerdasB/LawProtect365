/**
 * @file factories.ts
 * @description Convenience constructors for common domain failures using shared HttpError subclasses and signature codes.
 * Provides helper functions for creating consistent error instances with appropriate status codes,
 * error codes, and messages for the signature service domain.
 */

/**
 * @file factories.ts
 * @summary Convenience constructors for common domain failures
 *          using shared HttpError subclasses and signature codes.
 *
 * Use these helpers inside use cases and adapters for consistent messages,
 * status codes and error codes.
 */

import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  InternalError,
  NotFoundError,
  TooManyRequestsError,
  UnauthorizedError,
  UnprocessableEntityError,
} from "@lawprotect/shared-ts";
import { SignatureErrorCodes, type AnyErrorCode } from "./codes";

/**
 * @description Creates a NotFoundError for when an envelope was not found (404).
 *
 * @param {unknown} details - Optional additional error details
 * @returns {NotFoundError} Error instance for envelope not found
 */
export const envelopeNotFound = (details?: unknown) =>
  new NotFoundError("Envelope not found", SignatureErrorCodes.ENVELOPE_NOT_FOUND, details);

/**
 * @description Creates a NotFoundError for when a document was not found (404).
 *
 * @param {unknown} details - Optional additional error details
 * @returns {NotFoundError} Error instance for document not found
 */
export const documentNotFound = (details?: unknown) =>
  new NotFoundError("Document not found", SignatureErrorCodes.DOCUMENT_NOT_FOUND, details);

/**
 * @description Creates a NotFoundError for when a party was not found (404).
 *
 * @param {unknown} details - Optional additional error details
 * @returns {NotFoundError} Error instance for party not found
 */
export const partyNotFound = (details?: unknown) =>
  new NotFoundError("Party not found", SignatureErrorCodes.PARTY_NOT_FOUND, details);

/**
 * @description Creates a ConflictError for invalid party state (409).
 *
 * @param {unknown} details - Optional additional error details
 * @returns {ConflictError} Error instance for invalid party state
 */
export const invalidPartyState = (details?: unknown) =>
  new ConflictError("Invalid party state", SignatureErrorCodes.PARTY_INVALID_STATE, details);

/**
 * @description Creates a NotFoundError for when an input was not found (404).
 *
 * @param {unknown} details - Optional additional error details
 * @returns {NotFoundError} Error instance for input not found
 */
export const inputNotFound = (details?: unknown) =>
  new NotFoundError("Input not found", SignatureErrorCodes.INPUT_NOT_FOUND, details);

/**
 * @description Creates a ConflictError for when an envelope is already sent (409).
 *
 * @param {unknown} details - Optional additional error details
 * @returns {ConflictError} Error instance for envelope already sent
 */
export const envelopeAlreadySent = (details?: unknown) =>
  new ConflictError("Envelope already sent", SignatureErrorCodes.ENVELOPE_ALREADY_SENT, details);

/**
 * @description Creates a ConflictError for invalid envelope state transitions (409).
 *
 * @param {unknown} details - Optional additional error details
 * @returns {ConflictError} Error instance for invalid envelope state
 */
export const invalidEnvelopeState = (details?: unknown) =>
  new ConflictError("Invalid envelope state", SignatureErrorCodes.ENVELOPE_INVALID_STATE, details);

/**
 * @description Creates a ConflictError for when a document lock already exists (409).
 *
 * @param {unknown} details - Optional additional error details
 * @returns {ConflictError} Error instance for document lock exists
 */
export const documentLockExists = (details?: unknown) =>
  new ConflictError("Document lock already exists", SignatureErrorCodes.DOCUMENT_LOCK_EXISTS, details);

/**
 * @description Creates a BadRequestError for validation errors (400).
 *
 * @param {string} message - Error message
 * @param {AnyErrorCode} code - Error code (default: INPUT_TYPE_NOT_ALLOWED)
 * @param {unknown} details - Optional additional error details
 * @returns {BadRequestError} Error instance for bad request
 */
export const badRequest = (message: string, code: AnyErrorCode = SignatureErrorCodes.INPUT_TYPE_NOT_ALLOWED, details?: unknown) =>
  new BadRequestError(message, code, details);

/**
 * @description Creates a ConflictError for invalid document state (409).
 *
 * @param {unknown} details - Optional additional error details
 * @returns {ConflictError} Error instance for invalid document state
 */
export const invalidDocumentState = (details?: unknown) =>
  new ConflictError("Invalid document state", SignatureErrorCodes.ENVELOPE_INVALID_STATE, details);

/**
 * @description Creates a BadRequestError for invalid document content (400).
 *
 * @param {unknown} details - Optional additional error details
 * @returns {BadRequestError} Error instance for invalid document content
 */
export const invalidDocumentContent = (details?: unknown) =>
  new BadRequestError("Invalid document content", SignatureErrorCodes.INPUT_TYPE_NOT_ALLOWED, details);

/**
 * @description Creates a BadRequestError for invalid upload requests (400).
 *
 * @param {unknown} details - Optional additional error details
 * @returns {BadRequestError} Error instance for invalid upload request
 */
export const invalidUploadRequest = (details?: unknown) =>
  new BadRequestError("Invalid upload request", SignatureErrorCodes.INPUT_TYPE_NOT_ALLOWED, details);

/**
 * @description Creates a BadRequestError for invalid download requests (400).
 *
 * @param {unknown} details - Optional additional error details
 * @returns {BadRequestError} Error instance for invalid download request
 */
export const invalidDownloadRequest = (details?: unknown) =>
  new BadRequestError("Invalid download request", SignatureErrorCodes.INPUT_TYPE_NOT_ALLOWED, details);

/**
 * @description Creates an UnprocessableEntityError for semantically valid JSON that fails business rules (422).
 *
 * @param {string} message - Error message
 * @param {AnyErrorCode} code - Error code
 * @param {unknown} details - Optional additional error details
 * @returns {UnprocessableEntityError} Error instance for unprocessable entity
 */
export const unprocessable = (message: string, code: AnyErrorCode, details?: unknown) =>
  new UnprocessableEntityError(message, code, details);

/**
 * @description Creates a ForbiddenError for missing consent (403).
 *
 * @param {unknown} details - Optional additional error details
 * @returns {ForbiddenError} Error instance for consent required
 */
export const consentRequired = (details?: unknown) =>
  new ForbiddenError("Consent required", SignatureErrorCodes.CONSENT_REQUIRED, details);

/**
 * @description Creates a NotFoundError for KMS key not found (404).
 *
 * @param {unknown} details - Optional additional error details
 * @returns {NotFoundError} Error instance for KMS key not found
 */
export const kmsKeyNotFound = (details?: unknown) =>
  new NotFoundError("KMS key not found", SignatureErrorCodes.KMS_KEY_NOT_FOUND, details);

/**
 * @description Creates a ForbiddenError for KMS permission denied (403).
 *
 * @param {unknown} details - Optional additional error details
 * @returns {ForbiddenError} Error instance for KMS permission denied
 */
export const kmsPermissionDenied = (details?: unknown) =>
  new ForbiddenError("KMS permission denied", SignatureErrorCodes.KMS_PERMISSION_DENIED, details);

/**
 * @description Creates an InternalError for signature operation failures (500).
 *
 * @param {unknown} details - Optional additional error details
 * @returns {InternalError} Error instance for signature failed
 */
export const signatureFailed = (details?: unknown) =>
  new InternalError("Signature failed", SignatureErrorCodes.SIGNATURE_FAILED, details);

/**
 * @description Creates an UnprocessableEntityError for signature hash mismatches (422).
 *
 * @param {unknown} details - Optional additional error details
 * @returns {UnprocessableEntityError} Error instance for signature hash mismatch
 */
export const signatureHashMismatch = (details?: unknown) =>
  new UnprocessableEntityError("Signature hash mismatch", SignatureErrorCodes.SIGNATURE_HASH_MISMATCH, details);

/**
 * @description Creates an UnauthorizedError for invalid OTP (401).
 *
 * @param {unknown} details - Optional additional error details
 * @returns {UnauthorizedError} Error instance for invalid OTP
 */
export const otpInvalid = (details?: unknown) =>
  new UnauthorizedError("Invalid OTP", SignatureErrorCodes.OTP_INVALID, details);

/**
 * @description Creates an UnauthorizedError for expired OTP (401).
 *
 * @param {unknown} details - Optional additional error details
 * @returns {UnauthorizedError} Error instance for expired OTP
 */
export const otpExpired = (details?: unknown) =>
  new UnauthorizedError("OTP expired", SignatureErrorCodes.OTP_EXPIRED, details);

/**
 * @description Creates an UnauthorizedError for invalid request token (401).
 *
 * @param {unknown} details - Optional additional error details
 * @returns {UnauthorizedError} Error instance for invalid request token
 */
export const requestTokenInvalid = (details?: unknown) =>
  new UnauthorizedError("Invalid request token", SignatureErrorCodes.REQUEST_TOKEN_INVALID, details);

/**
 * @description Creates an UnauthorizedError for expired request token (401).
 *
 * @param {unknown} details - Optional additional error details
 * @returns {UnauthorizedError} Error instance for expired request token
 */
export const requestTokenExpired = (details?: unknown) =>
  new UnauthorizedError("Request token expired", SignatureErrorCodes.REQUEST_TOKEN_EXPIRED, details);

/**
 * @description Creates a ConflictError for incomplete evidence upload (409).
 *
 * @param {unknown} details - Optional additional error details
 * @returns {ConflictError} Error instance for evidence upload incomplete
 */
export const evidenceUploadIncomplete = (details?: unknown) =>
  new ConflictError("Evidence upload incomplete", SignatureErrorCodes.EVIDENCE_UPLOAD_INCOMPLETE, details);

/**
 * @description Creates a TooManyRequestsError for envelope send rate limiting (429).
 *
 * @param {number} retryAfterSeconds - Retry after seconds (default: 60)
 * @param {unknown} details - Optional additional error details
 * @returns {TooManyRequestsError} Error instance for envelope send rate limit
 */
export const rateLimitEnvelopeSend = (retryAfterSeconds = 60, details?: unknown) => {
  const err = new TooManyRequestsError(
    "Too Many Requests: envelope send rate limit",
    SignatureErrorCodes.RATE_LIMIT_ENVELOPE_SEND,
    details
  );
  // Consumers can add Retry-After header at the HTTP layer if desired.
  (err as any).retryAfterSeconds = retryAfterSeconds;
  return err;
};



/**
 * @description Creates a TooManyRequestsError for party invitation rate limiting (429).
 *
 * @param {number} retryAfterSeconds - Retry after seconds (default: 60)
 * @param {unknown} details - Optional additional error details
 * @returns {TooManyRequestsError} Error instance for party invitation rate limit
 */
export const rateLimitPartyInvite = (retryAfterSeconds = 60, details?: unknown) => {
  const err = new TooManyRequestsError(
    "Too Many Requests: party invitation limit",
    SignatureErrorCodes.RATE_LIMIT_PARTY_INVITE,
    details
  );
  (err as any).retryAfterSeconds = retryAfterSeconds;
  return err;
};


