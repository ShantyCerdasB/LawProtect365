/**
 * @file codes.ts
 * @summary Signature-service specific error codes.
 *
 * These codes complement the shared ErrorCodes catalog. Use them to keep
 * domain failures stable and machine-readable across logs, metrics and clients.
 */

import type { ErrorCode as SharedErrorCode } from "@lawprotect/shared-ts";

/**
 * Canonical error codes for the signature domain.
 *
 * Keep codes stable once released; treat them as part of the public contract.
 */
export const SignatureErrorCodes = {
  // Envelopes
  ENVELOPE_NOT_FOUND: "ENVELOPE_NOT_FOUND",
  ENVELOPE_ALREADY_SENT: "ENVELOPE_ALREADY_SENT",
  ENVELOPE_INVALID_STATE: "ENVELOPE_INVALID_STATE",

  // Documents
  DOCUMENT_NOT_FOUND: "DOCUMENT_NOT_FOUND",
  DOCUMENT_LOCK_EXISTS: "DOCUMENT_LOCK_EXISTS",
  DOCUMENT_LOCK_NOT_FOUND: "DOCUMENT_LOCK_NOT_FOUND",
  DOCUMENT_LOCK_EXPIRED: "DOCUMENT_LOCK_EXPIRED",
  DOCUMENT_LOCK_ACCESS_DENIED: "DOCUMENT_LOCK_ACCESS_DENIED",

  // Inputs / placement
  INPUT_NOT_FOUND: "INPUT_NOT_FOUND",
  INPUT_INVALID_POSITION: "INPUT_INVALID_POSITION",
  INPUT_TYPE_NOT_ALLOWED: "INPUT_TYPE_NOT_ALLOWED",

  // Parties
  PARTY_NOT_FOUND: "PARTY_NOT_FOUND",
  PARTY_EMAIL_REQUIRED: "PARTY_EMAIL_REQUIRED",
  PARTY_ROLE_INVALID: "PARTY_ROLE_INVALID",

  // Requests / tokens / OTP
  REQUEST_TOKEN_INVALID: "REQUEST_TOKEN_INVALID",
  REQUEST_TOKEN_EXPIRED: "REQUEST_TOKEN_EXPIRED",
  OTP_INVALID: "OTP_INVALID",
  OTP_EXPIRED: "OTP_EXPIRED",
  CONSENT_REQUIRED: "CONSENT_REQUIRED",

  // Signing / KMS / crypto
  SIGNATURE_FAILED: "SIGNATURE_FAILED",
  SIGNATURE_HASH_MISMATCH: "SIGNATURE_HASH_MISMATCH",
  KMS_KEY_NOT_FOUND: "KMS_KEY_NOT_FOUND",
  KMS_PERMISSION_DENIED: "KMS_PERMISSION_DENIED",

  // Evidence / uploads
  EVIDENCE_UPLOAD_INCOMPLETE: "EVIDENCE_UPLOAD_INCOMPLETE",
  EVIDENCE_OBJECT_NOT_FOUND: "EVIDENCE_OBJECT_NOT_FOUND",

  // Rate limits (domain-scoped; transport still uses 429)
  RATE_LIMIT_ENVELOPE_SEND: "RATE_LIMIT_ENVELOPE_SEND",
  RATE_LIMIT_PARTY_INVITE: "RATE_LIMIT_PARTY_INVITE", 
} as const;

/** Union of signature-service specific code strings. */
export type SignatureErrorCode = keyof typeof SignatureErrorCodes;

/**
 * Union of any error code this service can emit:
 * - Shared catalog from @lawprotect365/shared/errors
 * - Signature-service specific codes above
 */
export type AnyErrorCode = SharedErrorCode | SignatureErrorCode;
