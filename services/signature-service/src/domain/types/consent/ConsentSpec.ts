/**
 * @fileoverview ConsentSpec - Interface for consent query specifications
 * @summary Defines query criteria for consent searches
 * @description This interface provides type-safe query specifications for filtering
 * consents by various criteria including envelope, signer, compliance data, and usage.
 */

import { NetworkSecurityContext } from '@lawprotect/shared-ts';

export interface ConsentSpec extends NetworkSecurityContext {
  envelopeId?: string;
  signerId?: string;
  signatureId?: string;
  consentGiven?: boolean;
  consentText?: string;
  createdBy?: string;
  consentBefore?: Date;
  consentAfter?: Date;
  createdBefore?: Date;
  createdAfter?: Date;
}
