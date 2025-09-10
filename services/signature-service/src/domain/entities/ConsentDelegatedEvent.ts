/**
 * @file ConsentDelegatedEvent.ts
 * @summary Domain event for consent delegation
 * @description Represents the domain event emitted when a consent is delegated to another party
 */

import { ConsentId, EnvelopeId, PartyId } from "@/domain/value-objects/ids";

/**
 * @summary Domain event payload for consent delegation
 * @description Contains all the information about a consent delegation event
 */
export interface ConsentDelegatedEventPayload {
  /** Envelope identifier */
  readonly envelopeId: EnvelopeId;
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
 * @summary Domain event type constant for consent delegation
 * @description Used to identify consent delegation events in the system
 */
export const CONSENT_DELEGATED_EVENT_TYPE = "consent.delegated" as const;

/**
 * @summary Type for consent delegated domain event
 * @description Complete domain event structure for consent delegation
 */
export interface ConsentDelegatedEvent {
  readonly type: typeof CONSENT_DELEGATED_EVENT_TYPE;
  readonly payload: ConsentDelegatedEventPayload;
}

