/**
 * @file ServiceInterfaces.ts
 * @summary Service interfaces for signing operations
 * @description Defines interfaces for signing services (validation, command, event, audit, rate limit, S3)
 */

import type { ActorContext } from "../../../domain/entities/ActorContext";
import type { EnvelopeId, PartyId, TenantId } from "../../../domain/value-objects/Ids";
import type { 
  CompleteSigningControllerInput,
  DeclineSigningControllerInput,
  PrepareSigningControllerInput,
  SigningConsentControllerInput,
  PresignUploadControllerInput,
  DownloadSignedDocumentControllerInput
} from "./ControllerInputs";
import type { 
  CompleteSigningCommand,
  DeclineSigningCommand,
  PrepareSigningCommand,
  SigningConsentCommand,
  PresignUploadCommand,
  DownloadSignedDocumentCommand,
  CompleteSigningResult,
  DeclineSigningResult,
  PrepareSigningResult,
  SigningConsentResult,
  PresignUploadResult,
  DownloadSignedDocumentResult
} from "../../../app/ports/signing/SigningCommandsPort";

// ============================================================================
// VALIDATION SERVICE
// ============================================================================

/**
 * @summary Validation service for signing operations
 * @description Handles validation for signing operations using domain rules
 */
export interface SigningValidationService {
  /**
   * Validates complete signing input
   */
  validateCompleteSigning(input: CompleteSigningControllerInput): void;

  /**
   * Validates decline signing input
   */
  validateDeclineSigning(input: DeclineSigningControllerInput): void;

  /**
   * Validates prepare signing input
   */
  validatePrepareSigning(input: PrepareSigningControllerInput): void;

  /**
   * Validates signing consent input
   */
  validateSigningConsent(input: SigningConsentControllerInput): void;

  /**
   * Validates presign upload input
   */
  validatePresignUpload(input: PresignUploadControllerInput): void;

  /**
   * Validates download signed document input
   */
  validateDownloadSignedDocument(input: DownloadSignedDocumentControllerInput): void;
}

// ============================================================================
// COMMAND SERVICE
// ============================================================================

/**
 * @summary Command service for signing operations
 * @description Wrapper service for signing command operations
 */
export interface SigningCommandService {
  /**
   * Completes the signing process
   */
  completeSigning(command: CompleteSigningCommand): Promise<CompleteSigningResult>;

  /**
   * Declines the signing process
   */
  declineSigning(command: DeclineSigningCommand): Promise<DeclineSigningResult>;

  /**
   * Prepares the signing process
   */
  prepareSigning(command: PrepareSigningCommand): Promise<PrepareSigningResult>;

  /**
   * Records signing consent
   */
  recordSigningConsent(command: SigningConsentCommand): Promise<SigningConsentResult>;

  /**
   * Creates a presigned upload URL
   */
  presignUpload(command: PresignUploadCommand): Promise<PresignUploadResult>;

  /**
   * Creates a presigned download URL
   */
  downloadSignedDocument(command: DownloadSignedDocumentCommand): Promise<DownloadSignedDocumentResult>;
}

// ============================================================================
// EVENT SERVICE
// ============================================================================

/**
 * @summary Event service for signing domain events
 * @description Handles publishing of signing-related domain events using the outbox pattern
 */
export interface SigningEventService {
  /**
   * Publishes signing completed event
   */
  publishSigningCompleted(envelopeId: EnvelopeId, partyId: PartyId, tenantId: TenantId, actor: ActorContext): Promise<void>;

  /**
   * Publishes signing declined event
   */
  publishSigningDeclined(envelopeId: EnvelopeId, partyId: PartyId, tenantId: TenantId, actor: ActorContext): Promise<void>;

  /**
   * Publishes signing prepared event
   */
  publishSigningPrepared(envelopeId: EnvelopeId, partyId: PartyId, tenantId: TenantId, actor: ActorContext): Promise<void>;

  /**
   * Publishes signing consent recorded event
   */
  publishSigningConsentRecorded(envelopeId: EnvelopeId, partyId: PartyId, tenantId: TenantId, actor: ActorContext): Promise<void>;

  /**
   * Publishes presign upload event
   */
  publishPresignUpload(envelopeId: EnvelopeId, tenantId: TenantId, actor: ActorContext): Promise<void>;

  /**
   * Publishes download signed document event
   */
  publishDownloadSignedDocument(envelopeId: EnvelopeId, tenantId: TenantId, actor: ActorContext): Promise<void>;
}

// ============================================================================
// AUDIT SERVICE
// ============================================================================

/**
 * @summary Audit service for signing operations
 * @description Handles audit logging for signing operations
 */
export interface SigningAuditService {
  /**
   * Logs signing completion
   */
  logSigningCompleted(envelopeId: EnvelopeId, partyId: PartyId, tenantId: TenantId, actor: ActorContext): Promise<void>;

  /**
   * Logs signing decline
   */
  logSigningDeclined(envelopeId: EnvelopeId, partyId: PartyId, tenantId: TenantId, actor: ActorContext): Promise<void>;

  /**
   * Logs signing preparation
   */
  logSigningPrepared(envelopeId: EnvelopeId, partyId: PartyId, tenantId: TenantId, actor: ActorContext): Promise<void>;

  /**
   * Logs signing consent recorded
   */
  logSigningConsentRecorded(envelopeId: EnvelopeId, partyId: PartyId, tenantId: TenantId, actor: ActorContext): Promise<void>;

  /**
   * Logs presign upload
   */
  logPresignUpload(envelopeId: EnvelopeId, tenantId: TenantId, actor: ActorContext): Promise<void>;

  /**
   * Logs download signed document
   */
  logDownloadSignedDocument(envelopeId: EnvelopeId, tenantId: TenantId, actor: ActorContext): Promise<void>;
}

// ============================================================================
// RATE LIMIT SERVICE
// ============================================================================

/**
 * @summary Rate limit service for signing operations
 * @description Handles rate limiting for signing operations
 */
export interface SigningRateLimitService {
  /**
   * Checks and enforces signing preparation rate limits
   */
  checkPrepareSigningRateLimit(envelopeId: EnvelopeId, partyId: PartyId, tenantId: TenantId): Promise<void>;

  /**
   * Checks and enforces signing completion rate limits
   */
  checkSigningRateLimit(envelopeId: EnvelopeId, partyId: PartyId, tenantId: TenantId): Promise<void>;
}

// ============================================================================
// S3 SERVICE
// ============================================================================

/**
 * @summary S3 service for signing operations
 * @description Handles S3 operations for signing (upload/download)
 */
export interface SigningS3Service {
  /**
   * Creates a presigned upload URL
   */
  createPresignedUploadUrl(envelopeId: EnvelopeId, filename: string, contentType: string): Promise<{
    uploadUrl: string;
    objectKey: string;
    expiresAt: string;
  }>;

  /**
   * Creates a presigned download URL
   */
  createPresignedDownloadUrl(envelopeId: EnvelopeId): Promise<{
    downloadUrl: string;
    objectKey: string;
    expiresAt: string;
  }>;
}

export interface SigningCommandService {
  completeSigning(command: CompleteSigningCommand): Promise<CompleteSigningResult>;
  declineSigning(command: DeclineSigningCommand): Promise<DeclineSigningResult>;
  prepareSigning(command: PrepareSigningCommand): Promise<PrepareSigningResult>;
  recordSigningConsent(command: SigningConsentCommand): Promise<SigningConsentResult>;
  presignUpload(command: PresignUploadCommand): Promise<PresignUploadResult>;
  downloadSignedDocument(command: DownloadSignedDocumentCommand): Promise<DownloadSignedDocumentResult>;
}
