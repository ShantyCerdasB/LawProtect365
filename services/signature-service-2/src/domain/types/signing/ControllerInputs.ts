/**
 * @file ControllerInputs.ts
 * @summary Controller input types for signing operations
 * @description Defines input types for signing controllers, and actor are injected by factory
 */

import type { EnvelopeId, PartyId } from "@/domain/value-objects/ids";
import type { HashAlgorithm, KmsAlgorithm } from "../../../domain/values/enums";

// ============================================================================
// BASE TYPES
// ============================================================================

/**
 * @summary Base input for signing controllers
 * @description Base input that all signing controllers extend, is injected by factory
 */
export interface BaseSigningControllerInput {
  /** Tenant identifier (injected by factory) */
}

// ============================================================================
// COMPLETE SIGNING
// ============================================================================

/**
 * @summary Input for completing signing (controller level)
 * @description Parameters for completing the signing process, is injected by factory
 */
export interface CompleteSigningControllerInput extends BaseSigningControllerInput {
  /** Envelope identifier */
  readonly envelopeId: EnvelopeId;
  /** Signer/party identifier */
  readonly signerId: PartyId;
  /** URL of the final PDF from Documents Service */
  readonly finalPdfUrl: string;
  /** Precomputed digest to sign */
  readonly digest: {
    alg: HashAlgorithm;
    value: string;
  };
  /** KMS signing algorithm to use */
  readonly algorithm: KmsAlgorithm;
  /** Optional override for the KMS key id */
  readonly keyId?: string;
  /** Request token for authentication */
  readonly token: string;
}

// ============================================================================
// DECLINE SIGNING
// ============================================================================

/**
 * @summary Input for declining signing (controller level)
 * @description Parameters for declining the signing process, is injected by factory
 */
export interface DeclineSigningControllerInput extends BaseSigningControllerInput {
  /** Envelope identifier */
  readonly envelopeId: EnvelopeId;
  /** Signer/party identifier */
  readonly signerId: PartyId;
  /** Reason for declining */
  readonly reason: string;
  /** Request token for authentication */
  readonly token: string;
}

// ============================================================================
// PREPARE SIGNING
// ============================================================================

/**
 * @summary Input for preparing signing (controller level)
 * @description Parameters for preparing the signing process, is injected by factory
 */
export interface PrepareSigningControllerInput extends BaseSigningControllerInput {
  /** Envelope identifier */
  readonly envelopeId: EnvelopeId;
  /** Signer/party identifier */
  readonly signerId: PartyId;
  /** Request token for authentication */
  readonly token: string;
}

// ============================================================================
// SIGNING CONSENT
// ============================================================================

/**
 * @summary Input for recording signing consent (controller level)
 * @description Parameters for recording signing consent, is injected by factory
 */
export interface SigningConsentControllerInput extends BaseSigningControllerInput {
  /** Envelope identifier */
  readonly envelopeId: EnvelopeId;
  /** Signer/party identifier */
  readonly signerId: PartyId;
  /** Whether consent was given */
  readonly consentGiven: boolean;
  /** The consent text that was shown */
  readonly consentText: string;
  /** Request token for authentication */
  readonly token: string;
}

// ============================================================================
// PRESIGN UPLOAD
// ============================================================================

/**
 * @summary Input for presigning upload (controller level)
 * @description Parameters for creating a presigned upload URL, is injected by factory
 */
export interface PresignUploadControllerInput extends BaseSigningControllerInput {
  /** Envelope identifier */
  readonly envelopeId: EnvelopeId;
  /** Filename to upload */
  readonly filename: string;
  /** Content type of the file */
  readonly contentType: string;
  /** Request token for authentication */
  readonly token: string;
}

// ============================================================================
// DOWNLOAD SIGNED DOCUMENT
// ============================================================================

/**
 * @summary Input for downloading signed document (controller level)
 * @description Parameters for creating a presigned download URL, is injected by factory
 */
export interface DownloadSignedDocumentControllerInput extends BaseSigningControllerInput {
  /** Envelope identifier */
  readonly envelopeId: EnvelopeId;
  /** Request token for authentication */
  readonly token: string;
}

// ============================================================================
// VALIDATE INVITATION TOKEN
// ============================================================================

/**
 * @summary Input for validating invitation token (controller level)
 * @description Parameters for validating invitation token for unauthenticated signing
 */
export interface ValidateInvitationTokenControllerInput extends BaseSigningControllerInput {
  /** Invitation token to validate */
  readonly token: string;
  /** IP address of the requester */
  readonly ip?: string;
  /** User agent of the requester */
  readonly userAgent?: string;
}

/**
 * @summary Input for completing signing with invitation token
 */
export interface CompleteSigningWithTokenControllerInput {
  /** The envelope ID */
  readonly envelopeId: string;
  /** The signer/party ID */
  readonly signerId: string;
  /** URL of the final PDF from Documents Service */
  readonly finalPdfUrl: string;
  /** The invitation token for authentication */
  readonly token: string;
  /** Document digest information */
  readonly digest: {
    alg: string;
    value: string;
  };
  /** Signing algorithm */
  readonly algorithm: string;
  /** Optional key ID */
  readonly keyId?: string;
  /** IP address of the signer */
  readonly ip?: string;
  /** User agent of the signer */
  readonly userAgent?: string;
}

// ============================================================================
// SIGNING CONSENT WITH TOKEN
// ============================================================================

/**
 * @summary Input for recording consent with invitation token (controller level)
 * @description Parameters for recording consent using invitation tokens, no authentication required
 */
export interface SigningConsentWithTokenControllerInput extends BaseSigningControllerInput {
  /** Envelope identifier */
  readonly envelopeId: EnvelopeId;
  /** Signer/party identifier */
  readonly signerId: PartyId;
  /** The invitation token for authentication */
  readonly token: string;
  /** Whether consent was given */
  readonly consentGiven: boolean;
  /** The consent text that was shown */
  readonly consentText: string;
  /** IP address of the requester */
  readonly ip?: string;
  /** User agent of the requester */
  readonly userAgent?: string;
}

