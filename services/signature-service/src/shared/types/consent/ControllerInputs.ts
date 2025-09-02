/**
 * @file ControllerInputs.ts
 * @summary Input types for consent controllers
 * @description Defines input types for controllers that don't include tenantId (added by factory)
 */

import type { EnvelopeId, PartyId, ConsentId } from "../../../domain/value-objects/Ids";
import type { ConsentType, ConsentStatus } from "../../../domain/values/enums";

/**
 * @summary Input for creating consent controller
 * @description Parameters required to create a new consent (without tenantId)
 */
export interface CreateConsentControllerInput {
  /** Envelope identifier */
  readonly envelopeId: EnvelopeId;
  /** Party identifier */
  readonly partyId: PartyId;
  /** Consent type */
  readonly type: ConsentType;
  /** Consent status */
  readonly status: ConsentStatus;
  /** Expiration timestamp */
  readonly expiresAt?: string;
  /** Consent metadata */
  readonly metadata?: Record<string, unknown>;
  /** Idempotency key for preventing duplicate requests */
  readonly idempotencyKey?: string;
  /** TTL for idempotency key in seconds */
  readonly ttlSeconds?: number;
}

/**
 * @summary Input for listing consents controller
 * @description Parameters required to list consents (without tenantId)
 */
export interface ListConsentsControllerInput {
  /** Envelope identifier */
  readonly envelopeId: EnvelopeId;
  /** Maximum number of items to return */
  readonly limit?: number;
  /** Pagination cursor */
  readonly cursor?: string;
  /** Filter by consent status */
  readonly status?: ConsentStatus;
  /** Filter by consent type */
  readonly type?: ConsentType;
  /** Filter by party identifier */
  readonly partyId?: PartyId;
}

/**
 * @summary Input for updating consent controller
 * @description Parameters required to update a consent (without tenantId)
 */
export interface UpdateConsentControllerInput {
  /** Envelope identifier */
  readonly envelopeId: EnvelopeId;
  /** Consent identifier */
  readonly consentId: ConsentId;
  /** New consent status */
  readonly status?: ConsentStatus;
  /** New expiration timestamp */
  readonly expiresAt?: string;
  /** New consent metadata */
  readonly metadata?: Record<string, unknown>;
  /** Idempotency key for preventing duplicate requests */
  readonly idempotencyKey?: string;
  /** TTL for idempotency key in seconds */
  readonly ttlSeconds?: number;
}

/**
 * @summary Input for deleting consent controller
 * @description Parameters required to delete a consent (without tenantId)
 */
export interface DeleteConsentControllerInput {
  /** Envelope identifier */
  readonly envelopeId: EnvelopeId;
  /** Consent identifier */
  readonly consentId: ConsentId;
  /** Idempotency key for preventing duplicate requests */
  readonly idempotencyKey?: string;
  /** TTL for idempotency key in seconds */
  readonly ttlSeconds?: number;
}

/**
 * @summary Input for submitting consent controller
 * @description Parameters required to submit a consent (without tenantId)
 */
export interface SubmitConsentControllerInput {
  /** Envelope identifier */
  readonly envelopeId: EnvelopeId;
  /** Consent identifier */
  readonly consentId: ConsentId;
  /** Idempotency key for preventing duplicate requests */
  readonly idempotencyKey?: string;
  /** TTL for idempotency key in seconds */
  readonly ttlSeconds?: number;
}

/**
 * @summary Input for delegating consent controller
 * @description Parameters required to delegate a consent (without tenantId)
 */
export interface DelegateConsentControllerInput {
  /** Envelope identifier */
  readonly envelopeId: EnvelopeId;
  /** Consent identifier */
  readonly consentId: ConsentId;
  /** Email of the delegate */
  readonly delegateEmail: string;
  /** Name of the delegate */
  readonly delegateName: string;
  /** Reason for delegation (optional) */
  readonly reason?: string;
  /** Expiration date for the delegation (optional) */
  readonly expiresAt?: string;
  /** Additional metadata for the delegation (optional) */
  readonly metadata?: Record<string, unknown>;
  /** Idempotency key for preventing duplicate requests */
  readonly idempotencyKey?: string;
  /** TTL for idempotency key in seconds */
  readonly ttlSeconds?: number;
}
