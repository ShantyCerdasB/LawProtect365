/**
 * @file SigningCommandsPort.ts
 * @summary Port for signing command operations
 * @description Defines the interface for write operations on signing processes.
 * This port provides methods to handle OTP verification, signing completion,
 * and other signing-related operations with proper business rule validation.
 */

import { HashAlgorithm, KmsAlgorithm, OtpChannel } from "@/domain/values/enums";
import type { EventEnvelope } from "@lawprotect/shared-ts";

/**
 * Input for OTP verification operation
 */
export interface VerifyOtpCommand {
  /** The envelope ID */
  envelopeId: string;
  /** The signer/party ID */
  signerId: string;
  /** The OTP code to verify */
  code: string;
  /** The request token for authentication */
  token: string;
  /** Actor context information */
  actor: {
    ip?: string;
    userAgent?: string;
    email?: string;
    userId?: string;
  };
}

/**
 * Result of OTP verification
 */
export interface VerifyOtpResult {
  /** Whether the OTP was verified successfully */
  verified: boolean;
  /** Timestamp when verification occurred */
  verifiedAt: string;
  /** Event envelope for the verification */
  event: EventEnvelope;
}

/**
 * Input for OTP request operation
 */
export interface RequestOtpCommand {
  /** The envelope ID */
  envelopeId: string;
  /** The signer/party ID */
  signerId: string;
  /** The delivery channel (sms or email) */
  delivery: OtpChannel  
  /** The request token for authentication */
  token: string;
  /** Actor context information */
  actor: {
    ip?: string;
    userAgent?: string;
    email?: string;
    userId?: string;
  };
}

/**
 * Result of OTP request
 */
export interface RequestOtpResult {
  /** The delivery channel used */
  channel:OtpChannel
  /** When the OTP expires */
  expiresAt: string;
  /** Cooldown period in seconds */
  cooldownSeconds: number;
  /** Event envelope for the request */
  event: EventEnvelope;
}

/**
 * Input for signing completion operation
 */
export interface CompleteSigningCommand {
  /** The envelope ID */
  envelopeId: string;
  /** The signer/party ID */
  signerId: string;
  /** The request token for authentication */
  token: string;
  /** Precomputed digest to sign (base64url, no padding) */
  digest: {
    alg: HashAlgorithm;
    value: string;
  };
  /** KMS signing algorithm to use (must be allowed by policy) */
  algorithm: KmsAlgorithm
  /** Optional override for the KMS key id */
  keyId?: string;
  /** Optional OTP provided by the signer (when MFA is enabled) */
  otpCode?: string;
  /** Actor context information */
  actor: {
    ip?: string;
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
  envelopeId: string;
  /** The signer/party ID */
  signerId: string;
  /** The reason for declining */
  reason: string;
  /** The request token for authentication */
  token: string;
  /** Actor context information */
  actor: {
    ip?: string;
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
  envelopeId: string;
  /** The filename to upload */
  filename: string;
  /** The content type of the file */
  contentType: string;
  /** The request token for authentication */
  token: string;
  /** Actor context information */
  actor: {
    ip?: string;
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
  envelopeId: string;
  /** The request token for authentication */
  token: string;
  /** Actor context information */
  actor: {
    ip?: string;
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
   * Verifies an OTP code for a signer
   * @param command - The OTP verification command
   * @returns Promise resolving to verification result
   */
  verifyOtp(command: VerifyOtpCommand): Promise<VerifyOtpResult>;

  /**
   * Requests an OTP code for a signer
   * @param command - The OTP request command
   * @returns Promise resolving to request result
   */
  requestOtp(command: RequestOtpCommand): Promise<RequestOtpResult>;

  /**
   * Completes the signing process for a signer
   * @param command - The signing completion command
   * @returns Promise resolving to completion result
   */
  completeSigning(command: CompleteSigningCommand): Promise<CompleteSigningResult>;

  /**
   * Declines the signing process for a signer
   * @param command - The signing decline command
   * @returns Promise resolving to decline result
   */
  declineSigning(command: DeclineSigningCommand): Promise<DeclineSigningResult>;

  /**
   * Creates a presigned URL for file upload
   * @param command - The presign upload command
   * @returns Promise resolving to presign result
   */
  presignUpload(command: PresignUploadCommand): Promise<PresignUploadResult>;

  /**
   * Creates a presigned URL for downloading a signed document
   * @param command - The download signed document command
   * @returns Promise resolving to download result
   */
  downloadSignedDocument(command: DownloadSignedDocumentCommand): Promise<DownloadSignedDocumentResult>;
}
