/**
 * @file AuditDetails.ts
 * @summary Audit details types for consent module
 * @description Defines interfaces for audit details used by ConsentAuditService
 */

import type { 
  ConsentId, 
  PartyId 
} from "../../../domain/value-objects/Ids";

/**
 * @summary Audit details for consent delegation
 * @description Contains specific information for auditing consent delegation events
 */
export interface ConsentDelegationAuditDetails {
  /** Consent identifier */
  readonly consentId: ConsentId;
  /** Original party identifier */
  readonly originalPartyId: PartyId;
  /** Delegate party identifier */
  readonly delegatePartyId: PartyId;
  /** Delegation identifier */
  readonly delegationId: string;
  /** Reason for delegation */
  readonly reason?: string;
  /** Delegation expiration date */
  readonly expiresAt?: string;
  /** Additional metadata */
  readonly metadata?: Record<string, unknown>;
}

/**
 * @summary Audit details for consent update
 * @description Contains specific information for auditing consent update events
 */
export interface ConsentUpdateAuditDetails {
  /** Consent identifier */
  readonly consentId: ConsentId;
  /** Previous status */
  readonly previousStatus: string;
  /** New status */
  readonly newStatus: string;
  /** Update reason */
  readonly reason?: string;
  /** Additional metadata */
  readonly metadata?: Record<string, unknown>;
}
