/**
 * @file AppServiceInputs.ts
 * @summary Input and output types for consent application services
 * @description Defines the input and output contracts for consent application services
 */

import type { TenantId, EnvelopeId, PartyId, ConsentId } from "@/domain/value-objects/ids";
import type { ConsentStatus, ConsentType } from "../../../domain/values/enums";
import type { ActorContext } from "@lawprotect/shared-ts";

/**
 * @summary Input for getting consent app service
 * @description Parameters required to retrieve a specific consent
 */
export interface GetConsentAppInput {
  /** Tenant identifier */
  readonly tenantId: TenantId;
  /** Envelope identifier */
  readonly envelopeId: EnvelopeId;
  /** Consent identifier */
  readonly consentId: ConsentId;
}

/**
 * @summary Output for getting consent app service
 * @description Result containing the consent data for presentation
 */
export interface GetConsentAppResult {
  /** Consent identifier */
  readonly id: ConsentId;
  /** Envelope identifier */
  readonly envelopeId: EnvelopeId;
  /** Party identifier */
  readonly partyId: PartyId;
  /** Consent type */
  readonly type: ConsentType;
  /** Consent status */
  readonly status: ConsentStatus;
  /** Creation timestamp */
  readonly createdAt: string;
  /** Last update timestamp */
  readonly updatedAt?: string;
  /** Expiration timestamp */
  readonly expiresAt?: string;
  /** Consent metadata */
  readonly metadata?: Record<string, unknown>;
}

/**
 * @summary Input for creating consent app service
 * @description Parameters required to create a new consent
 */
export interface CreateConsentAppInput {
  /** Tenant identifier */
  readonly tenantId: TenantId;
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
 * @summary Output for creating consent app service
 * @description Result containing the created consent data
 */
export interface CreateConsentAppResult {
  /** Consent identifier */
  readonly id: ConsentId;
  /** Envelope identifier */
  readonly envelopeId: EnvelopeId;
  /** Party identifier */
  readonly partyId: PartyId;
  /** Consent type */
  readonly type: ConsentType;
  /** Consent status */
  readonly status: ConsentStatus;
  /** Creation timestamp */
  readonly createdAt: string;
  /** Expiration timestamp */
  readonly expiresAt?: string;
  /** Consent metadata */
  readonly metadata?: Record<string, unknown>;
}

/**
 * @summary Input for updating consent app service
 * @description Parameters required to update an existing consent
 */
export interface UpdateConsentAppInput {
  /** Tenant identifier */
  readonly tenantId: TenantId;
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
 * @summary Output for updating consent app service
 * @description Result containing the updated consent data
 */
export interface UpdateConsentAppResult {
  /** Consent identifier */
  readonly id: ConsentId;
  /** Envelope identifier */
  readonly envelopeId: EnvelopeId;
  /** Party identifier */
  readonly partyId: PartyId;
  /** Consent type */
  readonly type: ConsentType;
  /** Consent status */
  readonly status: ConsentStatus;
  /** Creation timestamp */
  readonly createdAt: string;
  /** Last update timestamp */
  readonly updatedAt: string;
  /** Expiration timestamp */
  readonly expiresAt?: string;
  /** Consent metadata */
  readonly metadata?: Record<string, unknown>;
}

/**
 * @summary Input for listing consents app service
 * @description Parameters required to list consents for an envelope
 */
export interface ListConsentsAppInput {
  /** Tenant identifier */
  readonly tenantId: TenantId;
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
 * @summary Output for listing consents app service
 * @description Result containing the list of consents
 */
export interface ListConsentsAppResult {
  /** Envelope identifier */
  readonly envelopeId: EnvelopeId;
  /** List of consents */
  readonly items: Array<{
    /** Consent identifier */
    readonly id: ConsentId;
    /** Party identifier */
    readonly partyId: PartyId;
    /** Consent type */
    readonly type: ConsentType;
    /** Consent status */
    readonly status: ConsentStatus;
    /** Creation timestamp */
    readonly createdAt: string;
    /** Last update timestamp */
    readonly updatedAt?: string;
    /** Expiration timestamp */
    readonly expiresAt?: string;
    /** Consent metadata */
    readonly metadata?: Record<string, unknown>;
  }>;
  /** Pagination metadata */
  readonly meta: {
    /** Maximum number of items */
    readonly limit: number;
    /** Next pagination cursor */
    readonly nextCursor?: string;
    /** Total number of items */
    readonly total?: number;
  };
}

/**
 * @summary Input for deleting consent app service
 * @description Parameters required to delete a consent
 */
export interface DeleteConsentAppInput {
  /** Tenant identifier */
  readonly tenantId: TenantId;
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
 * @summary Input for submitting consent app service
 * @description Parameters required to submit a consent
 */
export interface SubmitConsentAppInput {
  /** Tenant identifier */
  readonly tenantId: TenantId;
  /** Envelope identifier */
  readonly envelopeId: EnvelopeId;
  /** Consent identifier */
  readonly consentId: ConsentId;
  /** Actor context information (optional) */
  readonly actor?: ActorContext;
  /** Idempotency key for preventing duplicate requests */
  readonly idempotencyKey?: string;
  /** TTL for idempotency key in seconds */
  readonly ttlSeconds?: number;
}

/**
 * @summary Output for submitting consent app service
 * @description Result containing the submitted consent data
 */
export interface SubmitConsentAppResult {
  /** Consent identifier */
  readonly id: ConsentId;
  /** Envelope identifier */
  readonly envelopeId: EnvelopeId;
  /** Party identifier */
  readonly partyId: PartyId;
  /** Consent type */
  readonly type: ConsentType;
  /** Consent status */
  readonly status: ConsentStatus;
  /** Submission timestamp */
  readonly submittedAt: string;
  /** Consent metadata */
  readonly metadata?: Record<string, unknown>;
}

/**
 * @summary Input for delegating consent app service
 * @description Parameters required to delegate a consent
 */
export interface DelegateConsentAppInput {
  /** Tenant identifier */
  readonly tenantId: TenantId;
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
  /** Actor context information (optional) */
  readonly actor?: ActorContext;
  /** Idempotency key for preventing duplicate requests */
  readonly idempotencyKey?: string;
  /** TTL for idempotency key in seconds */
  readonly ttlSeconds?: number;
}

/**
 * @summary Output for delegating consent app service
 * @description Result containing the delegated consent data
 */
export interface DelegateConsentAppResult {
  /** Consent identifier */
  readonly id: ConsentId;
  /** Envelope identifier */
  readonly envelopeId: EnvelopeId;
  /** Delegation identifier */
  readonly delegationId: string;
  /** Email of the delegate */
  readonly delegateEmail: string;
  /** Name of the delegate */
  readonly delegateName: string;
  /** Delegation timestamp */
  readonly delegatedAt: string;
  /** Delegation metadata */
  readonly metadata?: Record<string, unknown>;
}






