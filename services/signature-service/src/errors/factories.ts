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
import { SignatureErrorCodes, type AnyErrorCode } from "./codes.js";

/** Envelope was not found (404). */
export const envelopeNotFound = (details?: unknown) =>
  new NotFoundError("Envelope not found", SignatureErrorCodes.ENVELOPE_NOT_FOUND, details);

/** Document was not found (404). */
export const documentNotFound = (details?: unknown) =>
  new NotFoundError("Document not found", SignatureErrorCodes.DOCUMENT_NOT_FOUND, details);

/** Party was not found (404). */
export const partyNotFound = (details?: unknown) =>
  new NotFoundError("Party not found", SignatureErrorCodes.PARTY_NOT_FOUND, details);

/** Input was not found (404). */
export const inputNotFound = (details?: unknown) =>
  new NotFoundError("Input not found", SignatureErrorCodes.INPUT_NOT_FOUND, details);

/** Envelope already sent (409). */
export const envelopeAlreadySent = (details?: unknown) =>
  new ConflictError("Envelope already sent", SignatureErrorCodes.ENVELOPE_ALREADY_SENT, details);

/** Invalid envelope state transition (409). */
export const invalidEnvelopeState = (details?: unknown) =>
  new ConflictError("Invalid envelope state", SignatureErrorCodes.ENVELOPE_INVALID_STATE, details);

/** Document lock already exists (409). */
export const documentLockExists = (details?: unknown) =>
  new ConflictError("Document lock already exists", SignatureErrorCodes.DOCUMENT_LOCK_EXISTS, details);

/** Validation error (400). */
export const badRequest = (message: string, code: AnyErrorCode = SignatureErrorCodes.INPUT_TYPE_NOT_ALLOWED, details?: unknown) =>
  new BadRequestError(message, code, details);

/** Semantically valid JSON but fails business rules (422). */
export const unprocessable = (message: string, code: AnyErrorCode, details?: unknown) =>
  new UnprocessableEntityError(message, code, details);

/** Missing consent for action (403). */
export const consentRequired = (details?: unknown) =>
  new ForbiddenError("Consent required", SignatureErrorCodes.CONSENT_REQUIRED, details);

/** KMS key missing (404) or permission denied (403). */
export const kmsKeyNotFound = (details?: unknown) =>
  new NotFoundError("KMS key not found", SignatureErrorCodes.KMS_KEY_NOT_FOUND, details);

export const kmsPermissionDenied = (details?: unknown) =>
  new ForbiddenError("KMS permission denied", SignatureErrorCodes.KMS_PERMISSION_DENIED, details);

/** Signature operation failed (500). */
export const signatureFailed = (details?: unknown) =>
  new InternalError("Signature failed", SignatureErrorCodes.SIGNATURE_FAILED, details);

/** Hash mismatch (422). */
export const signatureHashMismatch = (details?: unknown) =>
  new UnprocessableEntityError("Signature hash mismatch", SignatureErrorCodes.SIGNATURE_HASH_MISMATCH, details);

/** OTP invalid/expired (401 for invalid, 401 for expired to avoid leaking timing). */
export const otpInvalid = (details?: unknown) =>
  new UnauthorizedError("Invalid OTP", SignatureErrorCodes.OTP_INVALID, details);

export const otpExpired = (details?: unknown) =>
  new UnauthorizedError("OTP expired", SignatureErrorCodes.OTP_EXPIRED, details);

/** Request token invalid/expired (401). */
export const requestTokenInvalid = (details?: unknown) =>
  new UnauthorizedError("Invalid request token", SignatureErrorCodes.REQUEST_TOKEN_INVALID, details);

export const requestTokenExpired = (details?: unknown) =>
  new UnauthorizedError("Request token expired", SignatureErrorCodes.REQUEST_TOKEN_EXPIRED, details);

/** Evidence upload incomplete (409) */
export const evidenceUploadIncomplete = (details?: unknown) =>
  new ConflictError("Evidence upload incomplete", SignatureErrorCodes.EVIDENCE_UPLOAD_INCOMPLETE, details);

/** Domain-scoped rate limit (429). */
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

/** Domain-scoped rate limit (429): party invitation. */
export const rateLimitPartyInvite = (retryAfterSeconds = 60, details?: unknown) => {
  const err = new TooManyRequestsError(
    "Too Many Requests: party invitation limit",
    SignatureErrorCodes.RATE_LIMIT_PARTY_INVITE,
    details
  );
  (err as any).retryAfterSeconds = retryAfterSeconds;
  return err;
};
