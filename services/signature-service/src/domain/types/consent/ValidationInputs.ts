/**
 * @file ValidationInputs.ts
 * @summary Validation inputs types for consent module
 * @description Defines interfaces for validation inputs used by ConsentValidationService
 */

import type { 
  EnvelopeId, 
  ConsentId 
} from "@/domain/value-objects/ids";

/**
 * @summary Input for consent delegation validation
 * @description Contains the data needed to validate a consent delegation request
 */
export interface ConsentDelegationValidationInput {
  /** Tenant identifier */
  /** Envelope identifier */
  readonly envelopeId: EnvelopeId;
  /** Consent identifier */
  readonly consentId: ConsentId;
  /** Delegate email */
  readonly delegateEmail: string;
  /** Delegate name */
  readonly delegateName: string;
}

