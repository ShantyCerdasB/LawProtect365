/**
 * @file ControllerInputs.ts
 * @summary Controller input types for signing operations
 * @description Defines input types for signing controllers, tenantId and actor are injected by factory
 */

import type { EnvelopeId, PartyId, TenantId } from "../../../domain/value-objects/Ids";
import type { HashAlgorithm, KmsAlgorithm } from "../../../domain/values/enums";

// ============================================================================
// BASE TYPES
// ============================================================================

/**
 * @summary Base input for signing controllers
 * @description Base input that all signing controllers extend, tenantId is injected by factory
 */
export interface BaseSigningControllerInput {
  /** Tenant identifier (injected by factory) */
  readonly tenantId: TenantId;
}

// ============================================================================
// COMPLETE SIGNING
// ============================================================================

/**
 * @summary Input for completing signing (controller level)
 * @description Parameters for completing the signing process, tenantId is injected by factory
 */
export interface CompleteSigningControllerInput extends BaseSigningControllerInput {
  /** Envelope identifier */
  readonly envelopeId: EnvelopeId;
  /** Signer/party identifier */
  readonly signerId: PartyId;
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
 * @description Parameters for declining the signing process, tenantId is injected by factory
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
 * @description Parameters for preparing the signing process, tenantId is injected by factory
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
 * @description Parameters for recording signing consent, tenantId is injected by factory
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
 * @description Parameters for creating a presigned upload URL, tenantId is injected by factory
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
 * @description Parameters for creating a presigned download URL, tenantId is injected by factory
 */
export interface DownloadSignedDocumentControllerInput extends BaseSigningControllerInput {
  /** Envelope identifier */
  readonly envelopeId: EnvelopeId;
  /** Request token for authentication */
  readonly token: string;
}
