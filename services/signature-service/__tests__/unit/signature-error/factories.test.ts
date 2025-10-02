/**
 * @fileoverview Signature Error Factories Tests - Unit tests for signature error factories
 * @summary Comprehensive test coverage for all error factory functions
 * @description Tests all error factory functions, their error types, status codes,
 * error codes, and message consistency
 */

import {
  // Envelope Errors
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
  envelopeCreationFailed,
  envelopeTemplateValidationFailed,
  envelopeRequestValidationFailed,
  envelopeUpdateFailed,
  envelopeDeleteFailed,
  envelopeAccessDenied,
  
  // Signer Errors
  signerNotFound,
  signerAlreadySigned,
  signerAlreadyDeclined,
  invalidSignerState,
  signerEmailRequired,
  signerEmailDuplicate,
  signerCannotBeRemoved,
  signerCreationFailed,
  signerUpdateFailed,
  signerDeleteFailed,
  signerAccessDenied,
  signerSigningOrderViolation,
  
  // Signature Errors
  signatureNotFound,
  signatureFailed,
  signatureHashMismatch,
  signatureAlreadyExists,
  repositoryError,
  signatureCreationFailed,
  
  // KMS/Crypto Errors
  kmsKeyNotFound,
  kmsPermissionDenied,
  kmsSigningFailed,
  kmsValidationFailed,
  
  // Consent & Authentication Errors
  consentRequired,
  consentNotGiven,
  consentNotFound,
  consentInvalid,
  consentAlreadyExists,
  consentCreationFailed,
  consentTimestampRequired,
  consentTextRequired,
  consentIpRequired,
  consentUserAgentRequired,
  invitationTokenInvalid,
  invitationTokenExpired,
  invitationTokenAlreadyUsed,
  invitationTokenRevoked,
  
  // Document Service Integration Errors
  documentNotFound,
  documentNotReady,
  documentInvalidHash,
  documentS3Error,
  documentS3NotFound,
  invalidEntity,
  
  // Audit & Compliance Errors
  auditEventFailed,
  auditEventNotFound,
  auditEventCreationFailed,
  auditTrailNotFound,
  reminderTrackingNotFound,
  reminderTrackingCreationFailed,
  
  // Rate Limiting Errors
  rateLimitEnvelopeSend,
  rateLimitSignerInvite,
  rateLimitSignatureAttempt,
  
  // Generic Error Helpers
  badRequest,
  unprocessable,
  
  // Security & Access Control Errors
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
  
  // Compliance Error Factories
  complianceViolation,
  auditTrailIncomplete,
  documentIntegrityViolation,
  signatureInvalid,
  
  // Workflow Errors
  workflowViolation,
  invalidStateTransition,
  invalidSigningOrder,
  eventGenerationFailed
} from '@/signature-errors/factories';

import { SignatureErrorCodes } from '@/signature-errors/codes';

describe('Signature Error Factories', () => {
  const testDetails = { userId: 'test-user', envelopeId: 'test-envelope' };

  describe('Envelope Error Factories', () => {
    it('should create NotFoundError for envelope not found', () => {
      const error = envelopeNotFound(testDetails);
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Envelope not found');
      expect(error.code).toBe(SignatureErrorCodes.ENVELOPE_NOT_FOUND);
      expect(error.details).toBe(testDetails);
    });

    it('should create ConflictError for envelope already sent', () => {
      const error = envelopeAlreadySent(testDetails);
      expect(error.statusCode).toBe(409);
      expect(error.message).toBe('Envelope already sent');
      expect(error.code).toBe(SignatureErrorCodes.ENVELOPE_ALREADY_SENT);
      expect(error.details).toBe(testDetails);
    });

    it('should create ConflictError for invalid envelope state', () => {
      const error = invalidEnvelopeState(testDetails);
      expect(error.statusCode).toBe(409);
      expect(error.message).toBe('Invalid envelope state');
      expect(error.code).toBe(SignatureErrorCodes.ENVELOPE_INVALID_STATE);
      expect(error.details).toBe(testDetails);
    });

    it('should create ConflictError for envelope expired', () => {
      const error = envelopeExpired(testDetails);
      expect(error.statusCode).toBe(409);
      expect(error.message).toBe('Envelope has expired');
      expect(error.code).toBe(SignatureErrorCodes.ENVELOPE_EXPIRED);
      expect(error.details).toBe(testDetails);
    });

    it('should create ConflictError for envelope completed', () => {
      const error = envelopeCompleted(testDetails);
      expect(error.statusCode).toBe(409);
      expect(error.message).toBe('Envelope is already completed');
      expect(error.code).toBe(SignatureErrorCodes.ENVELOPE_COMPLETED);
      expect(error.details).toBe(testDetails);
    });

    it('should create ConflictError for envelope declined', () => {
      const error = envelopeDeclined(testDetails);
      expect(error.statusCode).toBe(409);
      expect(error.message).toBe('Envelope has been declined');
      expect(error.code).toBe(SignatureErrorCodes.ENVELOPE_DECLINED);
      expect(error.details).toBe(testDetails);
    });

    it('should create TooManyRequestsError for envelope limit exceeded', () => {
      const error = envelopeLimitExceeded(testDetails);
      expect(error.statusCode).toBe(429);
      expect(error.message).toBe('Envelope limit exceeded');
      expect(error.code).toBe(SignatureErrorCodes.ENVELOPE_LIMIT_EXCEEDED);
      expect(error.details).toBe(testDetails);
    });

    it('should create ConflictError for envelope title duplicate', () => {
      const error = envelopeTitleDuplicate(testDetails);
      expect(error.statusCode).toBe(409);
      expect(error.message).toBe('Envelope title is duplicate');
      expect(error.code).toBe(SignatureErrorCodes.ENVELOPE_TITLE_DUPLICATE);
      expect(error.details).toBe(testDetails);
    });

    it('should create BadRequestError for envelope expiration invalid', () => {
      const error = envelopeExpirationInvalid(testDetails);
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Envelope expiration is invalid');
      expect(error.code).toBe(SignatureErrorCodes.ENVELOPE_EXPIRATION_INVALID);
      expect(error.details).toBe(testDetails);
    });

    it('should create NotFoundError for envelope document not found', () => {
      const error = envelopeDocumentNotFound(testDetails);
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Envelope document not found');
      expect(error.code).toBe(SignatureErrorCodes.ENVELOPE_DOCUMENT_NOT_FOUND);
      expect(error.details).toBe(testDetails);
    });

    it('should create InternalError for envelope creation failed', () => {
      const error = envelopeCreationFailed(testDetails);
      expect(error.statusCode).toBe(500);
      expect(error.message).toBe('Envelope creation failed');
      expect(error.code).toBe(SignatureErrorCodes.ENVELOPE_CREATION_FAILED);
      expect(error.details).toBe(testDetails);
    });

    it('should create UnprocessableEntityError for envelope template validation failed', () => {
      const error = envelopeTemplateValidationFailed(testDetails);
      expect(error.statusCode).toBe(422);
      expect(error.message).toBe('templateId and templateVersion are required when originType is TEMPLATE');
      expect(error.code).toBe(SignatureErrorCodes.ENVELOPE_TEMPLATE_VALIDATION_FAILED);
      expect(error.details).toBe(testDetails);
    });

    it('should create UnprocessableEntityError for envelope request validation failed', () => {
      const customMessage = 'Custom validation message';
      const error = envelopeRequestValidationFailed(customMessage, testDetails);
      expect(error.statusCode).toBe(422);
      expect(error.message).toBe(customMessage);
      expect(error.code).toBe(SignatureErrorCodes.ENVELOPE_REQUEST_VALIDATION_FAILED);
      expect(error.details).toBe(testDetails);
    });

    it('should create InternalError for envelope update failed', () => {
      const error = envelopeUpdateFailed(testDetails);
      expect(error.statusCode).toBe(500);
      expect(error.message).toBe('Envelope update failed');
      expect(error.code).toBe(SignatureErrorCodes.ENVELOPE_UPDATE_FAILED);
      expect(error.details).toBe(testDetails);
    });

    it('should create InternalError for envelope delete failed', () => {
      const error = envelopeDeleteFailed(testDetails);
      expect(error.statusCode).toBe(500);
      expect(error.message).toBe('Envelope deletion failed');
      expect(error.code).toBe(SignatureErrorCodes.ENVELOPE_DELETE_FAILED);
      expect(error.details).toBe(testDetails);
    });

    it('should create ForbiddenError for envelope access denied', () => {
      const error = envelopeAccessDenied(testDetails);
      expect(error.statusCode).toBe(403);
      expect(error.message).toBe('Access denied to envelope');
      expect(error.code).toBe(SignatureErrorCodes.ENVELOPE_ACCESS_DENIED);
      expect(error.details).toBe(testDetails);
    });
  });

  describe('Signer Error Factories', () => {
    it('should create NotFoundError for signer not found', () => {
      const error = signerNotFound(testDetails);
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Signer not found');
      expect(error.code).toBe(SignatureErrorCodes.SIGNER_NOT_FOUND);
      expect(error.details).toBe(testDetails);
    });

    it('should create ConflictError for signer already signed', () => {
      const error = signerAlreadySigned(testDetails);
      expect(error.statusCode).toBe(409);
      expect(error.message).toBe('Signer has already signed');
      expect(error.code).toBe(SignatureErrorCodes.SIGNER_ALREADY_SIGNED);
      expect(error.details).toBe(testDetails);
    });

    it('should create ConflictError for signer already declined', () => {
      const error = signerAlreadyDeclined(testDetails);
      expect(error.statusCode).toBe(409);
      expect(error.message).toBe('Signer has already declined');
      expect(error.code).toBe(SignatureErrorCodes.SIGNER_ALREADY_DECLINED);
      expect(error.details).toBe(testDetails);
    });

    it('should create ConflictError for invalid signer state', () => {
      const error = invalidSignerState(testDetails);
      expect(error.statusCode).toBe(409);
      expect(error.message).toBe('Invalid signer state');
      expect(error.code).toBe(SignatureErrorCodes.SIGNER_INVALID_STATE);
      expect(error.details).toBe(testDetails);
    });

    it('should create BadRequestError for signer email required', () => {
      const error = signerEmailRequired(testDetails);
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Signer email is required');
      expect(error.code).toBe(SignatureErrorCodes.SIGNER_EMAIL_REQUIRED);
      expect(error.details).toBe(testDetails);
    });

    it('should create ConflictError for signer email duplicate', () => {
      const error = signerEmailDuplicate(testDetails);
      expect(error.statusCode).toBe(409);
      expect(error.message).toBe('Signer email already exists in envelope');
      expect(error.code).toBe(SignatureErrorCodes.SIGNER_EMAIL_DUPLICATE);
      expect(error.details).toBe(testDetails);
    });

    it('should create ConflictError for signer cannot be removed', () => {
      const error = signerCannotBeRemoved(testDetails);
      expect(error.statusCode).toBe(409);
      expect(error.message).toBe('Signer cannot be removed');
      expect(error.code).toBe(SignatureErrorCodes.SIGNER_CANNOT_BE_REMOVED);
      expect(error.details).toBe(testDetails);
    });

    it('should create InternalError for signer creation failed', () => {
      const error = signerCreationFailed(testDetails);
      expect(error.statusCode).toBe(500);
      expect(error.message).toBe('Failed to create signer');
      expect(error.code).toBe(SignatureErrorCodes.SIGNER_CREATION_FAILED);
      expect(error.details).toBe(testDetails);
    });

    it('should create InternalError for signer update failed', () => {
      const error = signerUpdateFailed(testDetails);
      expect(error.statusCode).toBe(500);
      expect(error.message).toBe('Failed to update signer');
      expect(error.code).toBe(SignatureErrorCodes.SIGNER_UPDATE_FAILED);
      expect(error.details).toBe(testDetails);
    });

    it('should create InternalError for signer delete failed', () => {
      const error = signerDeleteFailed(testDetails);
      expect(error.statusCode).toBe(500);
      expect(error.message).toBe('Failed to delete signer');
      expect(error.code).toBe(SignatureErrorCodes.SIGNER_DELETE_FAILED);
      expect(error.details).toBe(testDetails);
    });

    it('should create ForbiddenError for signer access denied', () => {
      const error = signerAccessDenied(testDetails);
      expect(error.statusCode).toBe(403);
      expect(error.message).toBe('Access denied to signer');
      expect(error.code).toBe(SignatureErrorCodes.SIGNER_ACCESS_DENIED);
      expect(error.details).toBe(testDetails);
    });

    it('should create ConflictError for signer signing order violation', () => {
      const error = signerSigningOrderViolation(testDetails);
      expect(error.statusCode).toBe(409);
      expect(error.message).toBe('Signing order violation');
      expect(error.code).toBe(SignatureErrorCodes.SIGNER_SIGNING_ORDER_VIOLATION);
      expect(error.details).toBe(testDetails);
    });
  });

  describe('Signature Error Factories', () => {
    it('should create NotFoundError for signature not found', () => {
      const error = signatureNotFound(testDetails);
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Signature not found');
      expect(error.code).toBe(SignatureErrorCodes.SIGNATURE_NOT_FOUND);
      expect(error.details).toBe(testDetails);
    });

    it('should create InternalError for signature failed', () => {
      const error = signatureFailed(testDetails);
      expect(error.statusCode).toBe(500);
      expect(error.message).toBe('Signature failed');
      expect(error.code).toBe(SignatureErrorCodes.SIGNATURE_FAILED);
      expect(error.details).toBe(testDetails);
    });

    it('should create UnprocessableEntityError for signature hash mismatch', () => {
      const error = signatureHashMismatch(testDetails);
      expect(error.statusCode).toBe(422);
      expect(error.message).toBe('Signature hash mismatch');
      expect(error.code).toBe(SignatureErrorCodes.SIGNATURE_HASH_MISMATCH);
      expect(error.details).toBe(testDetails);
    });

    it('should create ConflictError for signature already exists', () => {
      const error = signatureAlreadyExists(testDetails);
      expect(error.statusCode).toBe(409);
      expect(error.message).toBe('Signature already exists');
      expect(error.code).toBe(SignatureErrorCodes.SIGNATURE_ALREADY_EXISTS);
      expect(error.details).toBe(testDetails);
    });

    it('should create InternalError for repository error', () => {
      const error = repositoryError(testDetails);
      expect(error.statusCode).toBe(500);
      expect(error.message).toBe('Repository operation failed');
      expect(error.code).toBe(SignatureErrorCodes.REPOSITORY_ERROR);
      expect(error.details).toBe(testDetails);
    });

    it('should create InternalError for signature creation failed', () => {
      const error = signatureCreationFailed(testDetails);
      expect(error.statusCode).toBe(500);
      expect(error.message).toBe('Signature creation failed');
      expect(error.code).toBe(SignatureErrorCodes.SIGNATURE_FAILED);
      expect(error.details).toBe(testDetails);
    });
  });

  describe('KMS/Crypto Error Factories', () => {
    it('should create NotFoundError for KMS key not found', () => {
      const error = kmsKeyNotFound(testDetails);
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('KMS key not found');
      expect(error.code).toBe(SignatureErrorCodes.KMS_KEY_NOT_FOUND);
      expect(error.details).toBe(testDetails);
    });

    it('should create ForbiddenError for KMS permission denied', () => {
      const error = kmsPermissionDenied(testDetails);
      expect(error.statusCode).toBe(403);
      expect(error.message).toBe('KMS permission denied');
      expect(error.code).toBe(SignatureErrorCodes.KMS_PERMISSION_DENIED);
      expect(error.details).toBe(testDetails);
    });

    it('should create InternalError for KMS signing failed', () => {
      const error = kmsSigningFailed(testDetails);
      expect(error.statusCode).toBe(500);
      expect(error.message).toBe('KMS signing failed');
      expect(error.code).toBe(SignatureErrorCodes.KMS_SIGNING_FAILED);
      expect(error.details).toBe(testDetails);
    });

    it('should create UnprocessableEntityError for KMS validation failed', () => {
      const error = kmsValidationFailed(testDetails);
      expect(error.statusCode).toBe(422);
      expect(error.message).toBe('KMS validation failed');
      expect(error.code).toBe(SignatureErrorCodes.KMS_VALIDATION_FAILED);
      expect(error.details).toBe(testDetails);
    });
  });

  describe('Consent & Authentication Error Factories', () => {
    it('should create ForbiddenError for consent required', () => {
      const error = consentRequired(testDetails);
      expect(error.statusCode).toBe(403);
      expect(error.message).toBe('Consent required');
      expect(error.code).toBe(SignatureErrorCodes.CONSENT_REQUIRED);
      expect(error.details).toBe(testDetails);
    });

    it('should create ForbiddenError for consent not given', () => {
      const error = consentNotGiven(testDetails);
      expect(error.statusCode).toBe(403);
      expect(error.message).toBe('Consent not given');
      expect(error.code).toBe(SignatureErrorCodes.CONSENT_NOT_GIVEN);
      expect(error.details).toBe(testDetails);
    });

    it('should create NotFoundError for consent not found', () => {
      const error = consentNotFound(testDetails);
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Consent not found');
      expect(error.code).toBe(SignatureErrorCodes.CONSENT_NOT_FOUND);
      expect(error.details).toBe(testDetails);
    });

    it('should create BadRequestError for consent invalid', () => {
      const error = consentInvalid(testDetails);
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Invalid consent');
      expect(error.code).toBe(SignatureErrorCodes.CONSENT_INVALID);
      expect(error.details).toBe(testDetails);
    });

    it('should create BadRequestError for consent timestamp required', () => {
      const error = consentTimestampRequired(testDetails);
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Consent timestamp is required for legal compliance');
      expect(error.code).toBe(SignatureErrorCodes.CONSENT_TIMESTAMP_REQUIRED);
      expect(error.details).toBe(testDetails);
    });

    it('should create BadRequestError for consent text required', () => {
      const error = consentTextRequired(testDetails);
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Consent text is required for legal compliance');
      expect(error.code).toBe(SignatureErrorCodes.CONSENT_TEXT_REQUIRED);
      expect(error.details).toBe(testDetails);
    });

    it('should create BadRequestError for consent IP required', () => {
      const error = consentIpRequired(testDetails);
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('IP address is required for legal compliance');
      expect(error.code).toBe(SignatureErrorCodes.CONSENT_IP_REQUIRED);
      expect(error.details).toBe(testDetails);
    });

    it('should create BadRequestError for consent user agent required', () => {
      const error = consentUserAgentRequired(testDetails);
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('User agent is required for legal compliance');
      expect(error.code).toBe(SignatureErrorCodes.CONSENT_USER_AGENT_REQUIRED);
      expect(error.details).toBe(testDetails);
    });

    it('should create UnauthorizedError for invitation token invalid', () => {
      const error = invitationTokenInvalid(testDetails);
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Invalid invitation token');
      expect(error.code).toBe(SignatureErrorCodes.INVITATION_TOKEN_INVALID);
      expect(error.details).toBe(testDetails);
    });

    it('should create UnauthorizedError for invitation token expired', () => {
      const error = invitationTokenExpired(testDetails);
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Invitation token expired');
      expect(error.code).toBe(SignatureErrorCodes.INVITATION_TOKEN_EXPIRED);
      expect(error.details).toBe(testDetails);
    });

    it('should create ConflictError for consent already exists', () => {
      const error = consentAlreadyExists(testDetails);
      expect(error.statusCode).toBe(409);
      expect(error.message).toBe('Consent already exists');
      expect(error.code).toBe(SignatureErrorCodes.CONSENT_ALREADY_EXISTS);
      expect(error.details).toBe(testDetails);
    });

    it('should create InternalError for consent creation failed', () => {
      const error = consentCreationFailed(testDetails);
      expect(error.statusCode).toBe(500);
      expect(error.message).toBe('Consent creation failed');
      expect(error.code).toBe(SignatureErrorCodes.CONSENT_CREATION_FAILED);
      expect(error.details).toBe(testDetails);
    });

    it('should create ConflictError for invitation token already used', () => {
      const error = invitationTokenAlreadyUsed(testDetails);
      expect(error.statusCode).toBe(409);
      expect(error.message).toBe('Invitation token has already been used');
      expect(error.code).toBe(SignatureErrorCodes.INVITATION_TOKEN_ALREADY_USED);
      expect(error.details).toBe(testDetails);
    });

    it('should create ForbiddenError for invitation token revoked', () => {
      const error = invitationTokenRevoked(testDetails);
      expect(error.statusCode).toBe(403);
      expect(error.message).toBe('Invitation token has been revoked');
      expect(error.code).toBe(SignatureErrorCodes.INVITATION_TOKEN_REVOKED);
      expect(error.details).toBe(testDetails);
    });
  });

  describe('Document Service Integration Error Factories', () => {
    it('should create NotFoundError for document not found', () => {
      const error = documentNotFound(testDetails);
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Document not found');
      expect(error.code).toBe(SignatureErrorCodes.DOCUMENT_NOT_FOUND);
      expect(error.details).toBe(testDetails);
    });

    it('should create ConflictError for document not ready', () => {
      const error = documentNotReady(testDetails);
      expect(error.statusCode).toBe(409);
      expect(error.message).toBe('Document is not ready for signing');
      expect(error.code).toBe(SignatureErrorCodes.DOCUMENT_NOT_READY);
      expect(error.details).toBe(testDetails);
    });

    it('should create UnprocessableEntityError for document invalid hash', () => {
      const error = documentInvalidHash(testDetails);
      expect(error.statusCode).toBe(422);
      expect(error.message).toBe('Document hash is invalid');
      expect(error.code).toBe(SignatureErrorCodes.DOCUMENT_INVALID_HASH);
      expect(error.details).toBe(testDetails);
    });

    it('should create InternalError for document S3 error', () => {
      const error = documentS3Error(testDetails);
      expect(error.statusCode).toBe(500);
      expect(error.message).toBe('Document S3 error');
      expect(error.code).toBe(SignatureErrorCodes.DOCUMENT_S3_ERROR);
      expect(error.details).toBe(testDetails);
    });

    it('should create BadRequestError for document S3 not found', () => {
      const error = documentS3NotFound(testDetails);
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Document not found in S3');
      expect(error.code).toBe(SignatureErrorCodes.DOCUMENT_S3_ERROR);
      expect(error.details).toBe(testDetails);
    });

    it('should create BadRequestError for invalid entity', () => {
      const error = invalidEntity(testDetails);
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Invalid entity');
      expect(error.code).toBe(SignatureErrorCodes.INVALID_ENTITY);
      expect(error.details).toBe(testDetails);
    });
  });

  describe('Audit & Compliance Error Factories', () => {
    it('should create InternalError for audit event failed', () => {
      const error = auditEventFailed(testDetails);
      expect(error.statusCode).toBe(500);
      expect(error.message).toBe('Audit event failed');
      expect(error.code).toBe(SignatureErrorCodes.AUDIT_EVENT_FAILED);
      expect(error.details).toBe(testDetails);
    });

    it('should create NotFoundError for audit trail not found', () => {
      const error = auditTrailNotFound(testDetails);
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Audit trail not found');
      expect(error.code).toBe(SignatureErrorCodes.AUDIT_TRAIL_NOT_FOUND);
      expect(error.details).toBe(testDetails);
    });

    it('should create NotFoundError for audit event not found', () => {
      const error = auditEventNotFound(testDetails);
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Audit event not found');
      expect(error.code).toBe(SignatureErrorCodes.AUDIT_EVENT_NOT_FOUND);
      expect(error.details).toBe(testDetails);
    });

    it('should create InternalError for audit event creation failed', () => {
      const error = auditEventCreationFailed(testDetails);
      expect(error.statusCode).toBe(500);
      expect(error.message).toBe('Audit event creation failed');
      expect(error.code).toBe(SignatureErrorCodes.AUDIT_EVENT_CREATION_FAILED);
      expect(error.details).toBe(testDetails);
    });

    it('should create NotFoundError for reminder tracking not found', () => {
      const error = reminderTrackingNotFound(testDetails);
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Reminder tracking not found');
      expect(error.code).toBe(SignatureErrorCodes.REMINDER_TRACKING_NOT_FOUND);
      expect(error.details).toBe(testDetails);
    });

    it('should create InternalError for reminder tracking creation failed', () => {
      const error = reminderTrackingCreationFailed(testDetails);
      expect(error.statusCode).toBe(500);
      expect(error.message).toBe('Reminder tracking creation failed');
      expect(error.code).toBe(SignatureErrorCodes.REMINDER_TRACKING_FAILED);
      expect(error.details).toBe(testDetails);
    });
  });

  describe('Rate Limiting Error Factories', () => {
    it('should create TooManyRequestsError for envelope send rate limit with default retry', () => {
      const error = rateLimitEnvelopeSend();
      expect(error.statusCode).toBe(429);
      expect(error.message).toBe('Too Many Requests: envelope send rate limit');
      expect(error.code).toBe(SignatureErrorCodes.RATE_LIMIT_ENVELOPE_SEND);
      expect((error as any).retryAfterSeconds).toBe(60);
    });

    it('should create TooManyRequestsError for envelope send rate limit with custom retry', () => {
      const error = rateLimitEnvelopeSend(120, testDetails);
      expect(error.statusCode).toBe(429);
      expect(error.message).toBe('Too Many Requests: envelope send rate limit');
      expect(error.code).toBe(SignatureErrorCodes.RATE_LIMIT_ENVELOPE_SEND);
      expect(error.details).toBe(testDetails);
      expect((error as any).retryAfterSeconds).toBe(120);
    });

    it('should create TooManyRequestsError for signer invite rate limit with default retry', () => {
      const error = rateLimitSignerInvite();
      expect(error.statusCode).toBe(429);
      expect(error.message).toBe('Too Many Requests: signer invitation limit');
      expect(error.code).toBe(SignatureErrorCodes.RATE_LIMIT_SIGNER_INVITE);
      expect((error as any).retryAfterSeconds).toBe(60);
    });

    it('should create TooManyRequestsError for signer invite rate limit with custom retry', () => {
      const error = rateLimitSignerInvite(180, testDetails);
      expect(error.statusCode).toBe(429);
      expect(error.message).toBe('Too Many Requests: signer invitation limit');
      expect(error.code).toBe(SignatureErrorCodes.RATE_LIMIT_SIGNER_INVITE);
      expect(error.details).toBe(testDetails);
      expect((error as any).retryAfterSeconds).toBe(180);
    });

    it('should create TooManyRequestsError for signature attempt rate limit with default retry', () => {
      const error = rateLimitSignatureAttempt();
      expect(error.statusCode).toBe(429);
      expect(error.message).toBe('Too Many Requests: signature attempt limit');
      expect(error.code).toBe(SignatureErrorCodes.RATE_LIMIT_SIGNATURE_ATTEMPT);
      expect((error as any).retryAfterSeconds).toBe(60);
    });

    it('should create TooManyRequestsError for signature attempt rate limit with custom retry', () => {
      const error = rateLimitSignatureAttempt(300, testDetails);
      expect(error.statusCode).toBe(429);
      expect(error.message).toBe('Too Many Requests: signature attempt limit');
      expect(error.code).toBe(SignatureErrorCodes.RATE_LIMIT_SIGNATURE_ATTEMPT);
      expect(error.details).toBe(testDetails);
      expect((error as any).retryAfterSeconds).toBe(300);
    });
  });

  describe('Generic Error Helper Factories', () => {
    it('should create BadRequestError with default code', () => {
      const error = badRequest('Custom bad request message');
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Custom bad request message');
      expect(error.code).toBe(SignatureErrorCodes.SIGNER_EMAIL_REQUIRED);
    });

    it('should create BadRequestError with custom code and details', () => {
      const error = badRequest('Custom message', SignatureErrorCodes.ENVELOPE_NOT_FOUND, testDetails);
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Custom message');
      expect(error.code).toBe(SignatureErrorCodes.ENVELOPE_NOT_FOUND);
      expect(error.details).toBe(testDetails);
    });

    it('should create UnprocessableEntityError with custom message and code', () => {
      const error = unprocessable('Custom unprocessable message', SignatureErrorCodes.SIGNATURE_HASH_MISMATCH, testDetails);
      expect(error.statusCode).toBe(422);
      expect(error.message).toBe('Custom unprocessable message');
      expect(error.code).toBe(SignatureErrorCodes.SIGNATURE_HASH_MISMATCH);
      expect(error.details).toBe(testDetails);
    });
  });

  describe('Security & Access Control Error Factories', () => {
    it('should create ForbiddenError for access denied', () => {
      const error = accessDenied(testDetails);
      expect(error.statusCode).toBe(403);
      expect(error.message).toBe('Access denied');
      expect(error.code).toBe(SignatureErrorCodes.ACCESS_DENIED);
      expect(error.details).toBe(testDetails);
    });

    it('should create ForbiddenError for IP address blocked', () => {
      const error = ipAddressBlocked(testDetails);
      expect(error.statusCode).toBe(403);
      expect(error.message).toBe('IP address is blocked');
      expect(error.code).toBe(SignatureErrorCodes.IP_ADDRESS_BLOCKED);
      expect(error.details).toBe(testDetails);
    });

    it('should create ForbiddenError for user agent blocked', () => {
      const error = userAgentBlocked(testDetails);
      expect(error.statusCode).toBe(403);
      expect(error.message).toBe('User agent is blocked');
      expect(error.code).toBe(SignatureErrorCodes.USER_AGENT_BLOCKED);
      expect(error.details).toBe(testDetails);
    });

    it('should create UnauthorizedError for invalid access token', () => {
      const error = invalidAccessToken(testDetails);
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Invalid access token');
      expect(error.code).toBe(SignatureErrorCodes.INVALID_ACCESS_TOKEN);
      expect(error.details).toBe(testDetails);
    });

    it('should create UnauthorizedError for access token expired', () => {
      const error = accessTokenExpired(testDetails);
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Access token expired');
      expect(error.code).toBe(SignatureErrorCodes.ACCESS_TOKEN_EXPIRED);
      expect(error.details).toBe(testDetails);
    });

    it('should create ForbiddenError for permission denied', () => {
      const error = permissionDenied(testDetails);
      expect(error.statusCode).toBe(403);
      expect(error.message).toBe('Permission denied');
      expect(error.code).toBe(SignatureErrorCodes.PERMISSION_DENIED);
      expect(error.details).toBe(testDetails);
    });

    it('should create TooManyRequestsError for rate limit exceeded', () => {
      const error = rateLimitExceeded(testDetails);
      expect(error.statusCode).toBe(429);
      expect(error.message).toBe('Rate limit exceeded');
      expect(error.code).toBe(SignatureErrorCodes.RATE_LIMIT_EXCEEDED);
      expect(error.details).toBe(testDetails);
    });

    it('should create ForbiddenError for suspicious activity', () => {
      const error = suspiciousActivity(testDetails);
      expect(error.statusCode).toBe(403);
      expect(error.message).toBe('Suspicious activity detected');
      expect(error.code).toBe(SignatureErrorCodes.SUSPICIOUS_ACTIVITY);
      expect(error.details).toBe(testDetails);
    });

    it('should create ForbiddenError for geolocation blocked', () => {
      const error = geolocationBlocked(testDetails);
      expect(error.statusCode).toBe(403);
      expect(error.message).toBe('Geolocation is blocked');
      expect(error.code).toBe(SignatureErrorCodes.GEOLOCATION_BLOCKED);
      expect(error.details).toBe(testDetails);
    });

    it('should create ForbiddenError for device not trusted', () => {
      const error = deviceNotTrusted(testDetails);
      expect(error.statusCode).toBe(403);
      expect(error.message).toBe('Device is not trusted');
      expect(error.code).toBe(SignatureErrorCodes.DEVICE_NOT_TRUSTED);
      expect(error.details).toBe(testDetails);
    });
  });

  describe('Compliance Error Factories', () => {
    it('should create ForbiddenError for compliance violation', () => {
      const error = complianceViolation(testDetails);
      expect(error.statusCode).toBe(403);
      expect(error.message).toBe('Compliance violation detected');
      expect(error.code).toBe(SignatureErrorCodes.COMPLIANCE_VIOLATION);
      expect(error.details).toBe(testDetails);
    });

    it('should create ForbiddenError for audit trail incomplete', () => {
      const error = auditTrailIncomplete(testDetails);
      expect(error.statusCode).toBe(403);
      expect(error.message).toBe('Audit trail is incomplete or invalid');
      expect(error.code).toBe(SignatureErrorCodes.AUDIT_TRAIL_INCOMPLETE);
      expect(error.details).toBe(testDetails);
    });

    it('should create ForbiddenError for document integrity violation', () => {
      const error = documentIntegrityViolation(testDetails);
      expect(error.statusCode).toBe(403);
      expect(error.message).toBe('Document integrity violation detected');
      expect(error.code).toBe(SignatureErrorCodes.DOCUMENT_INTEGRITY_VIOLATION);
      expect(error.details).toBe(testDetails);
    });

    it('should create BadRequestError for signature invalid', () => {
      const error = signatureInvalid(testDetails);
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Signature is invalid or malformed');
      expect(error.code).toBe(SignatureErrorCodes.SIGNATURE_INVALID);
      expect(error.details).toBe(testDetails);
    });
  });

  describe('Workflow Error Factories', () => {
    it('should create BadRequestError for workflow violation', () => {
      const error = workflowViolation(testDetails);
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Workflow rule violation');
      expect(error.code).toBe(SignatureErrorCodes.WORKFLOW_VIOLATION);
      expect(error.details).toBe(testDetails);
    });

    it('should create BadRequestError for invalid state transition', () => {
      const error = invalidStateTransition(testDetails);
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Invalid state transition');
      expect(error.code).toBe(SignatureErrorCodes.INVALID_STATE_TRANSITION);
      expect(error.details).toBe(testDetails);
    });

    it('should create BadRequestError for invalid signing order', () => {
      const error = invalidSigningOrder(testDetails);
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Invalid signing order');
      expect(error.code).toBe(SignatureErrorCodes.INVALID_SIGNING_ORDER);
      expect(error.details).toBe(testDetails);
    });

    it('should create InternalError for event generation failed', () => {
      const error = eventGenerationFailed(testDetails);
      expect(error.statusCode).toBe(500);
      expect(error.message).toBe('Failed to generate workflow event');
      expect(error.code).toBe(SignatureErrorCodes.EVENT_GENERATION_FAILED);
      expect(error.details).toBe(testDetails);
    });
  });

  describe('Error Factory Consistency', () => {
    it('should handle undefined details parameter', () => {
      const error = envelopeNotFound();
      expect(error.details).toBeUndefined();
    });

    it('should handle null details parameter', () => {
      const error = envelopeNotFound(null);
      expect(error.details).toBeNull();
    });

    it('should handle complex details object', () => {
      const complexDetails = {
        userId: 'user-123',
        envelopeId: 'env-456',
        timestamp: new Date(),
        metadata: { source: 'api', version: '1.0' }
      };
      const error = envelopeNotFound(complexDetails);
      expect(error.details).toEqual(complexDetails);
    });

    it('should maintain consistent error structure across all factories', () => {
      const errors = [
        envelopeNotFound(testDetails),
        signerNotFound(testDetails),
        signatureNotFound(testDetails),
        kmsKeyNotFound(testDetails),
        consentRequired(testDetails),
        documentNotFound(testDetails),
        auditEventFailed(testDetails),
        accessDenied(testDetails),
        complianceViolation(testDetails),
        workflowViolation(testDetails)
      ];

      for (const error of errors) {
        expect(error).toHaveProperty('statusCode');
        expect(error).toHaveProperty('message');
        expect(error).toHaveProperty('code');
        expect(error).toHaveProperty('details');
        expect(typeof error.statusCode).toBe('number');
        expect(typeof error.message).toBe('string');
        expect(typeof error.code).toBe('string');
      }
    });

    it('should use correct HTTP status codes for each error type', () => {
      const results = [
        envelopeNotFound(testDetails),
        envelopeAlreadySent(testDetails),
        envelopeExpirationInvalid(testDetails),
        signerEmailRequired(testDetails),
        signatureFailed(testDetails),
        signatureHashMismatch(testDetails),
        kmsPermissionDenied(testDetails),
        consentRequired(testDetails),
        invitationTokenInvalid(testDetails),
        rateLimitEnvelopeSend(60, testDetails),
      ];

      const expected = [404, 409, 400, 400, 500, 422, 403, 403, 401, 429];
      for (let idx = 0; idx < results.length; idx++) {
        const error = results[idx];
        expect(error.statusCode).toBe(expected[idx]);
      }
    });
  });
});
