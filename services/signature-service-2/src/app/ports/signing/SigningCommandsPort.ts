/**
 * @file SigningCommandsPort.ts
 * @summary Port for signing command operations
 * @description Defines the interface for write operations on signing processes.
 * This port provides methods to handle signing completion,
 * and other signing-related operations with proper business rule validation.
 */

import { HashAlgorithm, KmsAlgorithm } from "../../../domain/values/enums";
import type { EventEnvelope } from "@lawprotect/shared-ts";
import type { EnvelopeId, PartyId, IpAddress } from "../../../domain/value-objects/index";

/**
 * Input for signing consent operation
 */
export interface SigningConsentCommand {
  /** The envelope ID */
  envelopeId: EnvelopeId;
  /** The signer/party ID */
  signerId: PartyId;
  /** The request token for authentication */
  token: string;
  /** Actor context information */
  actor: {
    ip?: IpAddress;
    userAgent?: string;
    email?: string;
    userId?: string;
  };
}

/**
 * Result of signing consent
 */
export interface SigningConsentResult {
  /** Whether the consent was recorded successfully */
  consented: boolean;
  /** Timestamp when consent was given */
  consentedAt: string;
  /** Event envelope for the consent */
  event: EventEnvelope;
}

/**
 * Input for signing preparation operation
 */
export interface PrepareSigningCommand {
  /** The envelope ID */
  envelopeId: EnvelopeId;
  /** The signer/party ID */
  signerId: PartyId;
  /** The request token for authentication */
  token: string;
  /** Actor context information */
  actor: {
    ip?: IpAddress;
    userAgent?: string;
    email?: string;
    userId?: string;
  };
}

/**
 * Result of signing preparation
 */
export interface PrepareSigningResult {
  /** Whether preparation was successful */
  prepared: boolean;
  /** Timestamp when preparation occurred */
  preparedAt: string;
  /** Event envelope for the preparation */
  event: EventEnvelope;
}

/**
 * Input for signing completion operation
 */
export interface CompleteSigningCommand {
  /** The envelope ID */
  envelopeId: EnvelopeId;
  /** The signer/party ID */
  signerId: PartyId;
  /** URL of the final PDF from Documents Service */
  finalPdfUrl: string;
  /** The request token for authentication */
  token: string;
  /** Precomputed digest to sign (base64url, no padding) */
  digest: {
    alg: HashAlgorithm;
    value: string;
  };
  /** KMS signing algorithm to use (must be allowed by policy) */
  algorithm: KmsAlgorithm;
  /** Optional override for the KMS key id */
  keyId?: string;
  /** Actor context information */
  actor: {
    ip?: IpAddress;
    userAgent?: string;
    email?: string;
    userId?: string;
  };
}

/**
 * Input for signing decline operation
 */
export interface DeclineSigningCommand {
  /** The envelope ID */
  envelopeId: EnvelopeId;
  /** The signer/party ID */
  signerId: PartyId;
  /** The reason for declining */
  reason: string;
  /** The request token for authentication */
  token: string;
  /** Actor context information */
  actor: {
    ip?: IpAddress;
    userAgent?: string;
    email?: string;
    userId?: string;
  };
}

/**
 * Input for presign upload operation
 */
export interface PresignUploadCommand {
  /** The envelope ID */
  envelopeId: EnvelopeId;
  /** The filename to upload */
  filename: string;
  /** The content type of the file */
  contentType: string;
  /** The request token for authentication */
  token: string;
  /** Actor context information */
  actor: {
    ip?: IpAddress;
    userAgent?: string;
    email?: string;
    userId?: string;
  };
}

/**
 * Input for download signed document operation
 */
export interface DownloadSignedDocumentCommand {
  /** The envelope ID */
  envelopeId: EnvelopeId;
  /** The request token for authentication */
  token: string;
  /** Actor context information */
  actor: {
    ip?: IpAddress;
    userAgent?: string;
    email?: string;
    userId?: string;
  };
}

/**
 * Result of signing completion
 */
export interface CompleteSigningResult {
  /** Whether the signing was completed successfully */
  completed: boolean;
  /** Timestamp when signing was completed */
  completedAt: string;
  /** The signature generated */
  signature: string;
  /** The key ID used for signing */
  keyId: string;
  /** The algorithm used for signing */
  algorithm: string;
  /** Event envelope for the completion */
  event: EventEnvelope;
}

/**
 * Result of signing decline
 */
export interface DeclineSigningResult {
  /** Whether the signing was declined successfully */
  declined: boolean;
  /** Timestamp when decline occurred */
  declinedAt: string;
  /** The reason for declining */
  reason: string;
  /** Event envelope for the decline */
  event: EventEnvelope;
}

/**
 * Result of presign upload
 */
export interface PresignUploadResult {
  /** The presigned URL for upload */
  uploadUrl: string;
  /** The S3 object key */
  objectKey: string;
  /** When the presigned URL expires */
  expiresAt: string;
  /** Event envelope for the presign */
  event: EventEnvelope;
}

/**
 * Result of download signed document
 */
export interface DownloadSignedDocumentResult {
  /** The presigned URL for download */
  downloadUrl: string;
  /** The S3 object key */
  objectKey: string;
  /** When the presigned URL expires */
  expiresAt: string;
  /** Event envelope for the download */
  event: EventEnvelope;
}

/**
 * Port interface for signing command operations
 * 
 * This port defines the contract for write operations on signing processes.
 * Implementations should handle business rule validation and event publishing.
 */
export interface SigningCommandsPort {
  /**
   * @summary Records signing consent for a signer
   * @description Records signing consent for a signer with proper validation
   * @param command - The signing consent command
   * @returns Promise resolving to consent result
   */
  recordSigningConsent(command: SigningConsentCommand): Promise<SigningConsentResult>;

  /**
   * @summary Prepares signing process for a signer
   * @description Prepares signing process for a signer with proper validation
   * @param command - The signing preparation command
   * @returns Promise resolving to preparation result
   */
  prepareSigning(command: PrepareSigningCommand): Promise<PrepareSigningResult>;

  /**
   * @summary Completes the signing process for a signer
   * @description Completes the signing process for a signer with KMS operations
   * @param command - The signing completion command
   * @returns Promise resolving to completion result
   */
  completeSigning(command: CompleteSigningCommand): Promise<CompleteSigningResult>;

  /**
   * @summary Declines the signing process for a signer
   * @description Declines the signing process for a signer with proper status updates
   * @param command - The signing decline command
   * @returns Promise resolving to decline result
   */
  declineSigning(command: DeclineSigningCommand): Promise<DeclineSigningResult>;

  /**
   * @summary Creates a presigned URL for file upload
   * @description Creates a presigned URL for file upload with proper validation
   * @param command - The presign upload command
   * @returns Promise resolving to presign result
   */
  presignUpload(command: PresignUploadCommand): Promise<PresignUploadResult>;

  /**
   * @summary Creates a presigned URL for downloading a signed document
   * @description Creates a presigned URL for downloading a signed document
   * @param command - The download signed document command
   * @returns Promise resolving to download result
   */
  downloadSignedDocument(command: DownloadSignedDocumentCommand): Promise<DownloadSignedDocumentResult>;

  /**
   * @summary Validates an invitation token for unauthenticated signing
   * @description Validates an invitation token and returns party information
   * @param command - The validate invitation token command
   * @returns Promise resolving to validation result
   */
  validateInvitationToken(command: ValidateInvitationTokenCommand): Promise<ValidateInvitationTokenResult>;

  /**
   * @summary Completes signing using an invitation token (unauthenticated)
   * @description Allows unauthenticated users to sign documents using invitation tokens
   * @param command - The complete signing with token command
   * @returns Promise resolving to signing result
   */
  completeSigningWithToken(command: CompleteSigningWithTokenCommand): Promise<CompleteSigningWithTokenResult>;

  /**
   * @summary Records signing consent using an invitation token (unauthenticated)
   * @description Allows unauthenticated users to record consent using invitation tokens
   * @param command - The signing consent with token command
   * @returns Promise resolving to consent result
   */
  recordSigningConsentWithToken(command: SigningConsentWithTokenCommand): Promise<SigningConsentResult>;
};

/**
 * @summary Command for validating invitation tokens
 */
export interface ValidateInvitationTokenCommand {
  /** The invitation token to validate */
  token: string;
  /** IP address of the requester */
  ip?: string;
  /** User agent of the requester */
  userAgent?: string;
}

/**
 * @summary Result of invitation token validation
 */
export interface ValidateInvitationTokenResult {
  /** Whether the token is valid */
  valid: boolean;
  /** Token ID if valid */
  tokenId?: string;
  /** Envelope ID if valid */
  envelopeId?: string;
  /** Party ID if valid */
  partyId?: string;
  /** Email of the invited party */
  email?: string;
  /** Name of the invited party */
  name?: string;
  /** Role of the invited party */
  role?: string;
  /** Email of the person who created the invitation */
  invitedBy?: string;
  /** Name of the person who created the invitation */
  invitedByName?: string;
  /** Custom message for the invitation */
  message?: string;
  /** Deadline for signing */
  signByDate?: string;
  /** Signing order preference */
  signingOrder?: string;
  /** When the token expires */
  expiresAt?: string;
  /** Error message if validation failed */
  error?: string;
}

/**
 * @summary Command for completing signing with invitation token
 */
export interface CompleteSigningWithTokenCommand {
  /** The envelope ID */
  envelopeId: EnvelopeId;
  /** The signer/party ID */
  signerId: PartyId;
  /** The invitation token for authentication */
  token: string;
  /** Document digest information */
  digest: {
    alg: HashAlgorithm;
    value: string;
  };
  /** Signing algorithm */
  algorithm: KmsAlgorithm;
  /** Optional key ID */
  keyId?: string;
  /** IP address of the signer */
  ip?: string;
  /** User agent of the signer */
  userAgent?: string;
}

/**
 * @summary Result of completing signing with invitation token
 */
export interface CompleteSigningWithTokenResult {
  /** Whether the signing was completed successfully */
  signed: boolean;
  /** Signature ID if successful */
  signatureId?: string;
  /** Envelope status after signing */
  envelopeStatus?: string;
  /** Timestamp when signing was completed */
  signedAt?: string;
  /** Error message if signing failed */
  error?: string;
}

/**
 * @summary Command for recording consent with invitation token
 */
export interface SigningConsentWithTokenCommand {
  /** The envelope ID */
  envelopeId: EnvelopeId;
  /** The signer/party ID */
  signerId: PartyId;
  /** The invitation token for authentication */
  token: string;
  /** Whether consent was given */
  consentGiven: boolean;
  /** The consent text that was shown */
  consentText: string;
  /** IP address of the requester */
  ip?: string;
  /** User agent of the requester */
  userAgent?: string;
}
