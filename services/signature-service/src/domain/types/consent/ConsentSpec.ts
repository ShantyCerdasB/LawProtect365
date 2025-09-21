/**
 * @fileoverview ConsentSpec - Interface for consent query specifications
 * @summary Defines query criteria for consent searches
 * @description This interface provides type-safe query specifications for filtering
 * consents by various criteria including envelope, signer, compliance data, and usage.
 */

export interface ConsentSpec {
  envelopeId?: string;
  signerId?: string;
  signatureId?: string;
  consentGiven?: boolean;
  consentText?: string;
  ipAddress?: string;
  userAgent?: string;
  createdBy?: string;
  consentBefore?: Date;
  consentAfter?: Date;
  createdBefore?: Date;
  createdAfter?: Date;
}
