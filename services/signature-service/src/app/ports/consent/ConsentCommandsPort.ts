/**
 * @file ConsentCommandsPort.ts
 * @summary Port interface for consent command operations
 * @description Defines the interface for write-oriented consent operations including create, update, delete, submit, and delegate
 */

import type { ConsentId, TenantId, EnvelopeId, PartyId } from "../shared";
import type { ConsentPatch } from "../shared/consents/types.consent";

/**
 * Actor context information for consent operations
 */
export interface ActorContext {
  /** User ID of the actor (optional) */
  userId?: string;
  /** Email of the actor (optional) */
  email?: string;
  /** IP address of the actor (optional) */
  ip?: string;
  /** User agent of the actor (optional) */
  userAgent?: string;
  /** Locale of the actor (optional) */
  locale?: string;
}

/**
 * Input parameters for creating a consent
 */
export interface CreateConsentCommand {
  /** The tenant ID that owns the consent */
  tenantId: TenantId;
  /** The envelope ID this consent belongs to */
  envelopeId: EnvelopeId;
  /** The party ID this consent is for */
  partyId: PartyId;
  /** The type of consent being created */
  consentType: string;
  /** Additional metadata for the consent (optional) */
  metadata?: Record<string, unknown>;
  /** Expiration date for the consent (optional) */
  expiresAt?: string;
  /** Actor context information (optional) */
  actor?: ActorContext;
}

/**
 * Result of consent creation
 */
export interface CreateConsentResult {
  /** The unique identifier of the created consent */
  consentId: ConsentId;
  /** ISO timestamp when the consent was created */
  createdAt: string;
}

/**
 * Result of consent update
 */
export interface UpdateConsentResult {
  /** The unique identifier of the updated consent */
  consentId: ConsentId;
  /** ISO timestamp when the consent was last updated */
  updatedAt: string;
}

/**
 * Input parameters for consent delegation
 */
export interface DelegateConsentCommand {
  /** The envelope ID this consent belongs to */
  envelopeId: EnvelopeId;
  /** The consent ID being delegated */
  consentId: ConsentId;
  /** Email of the delegate */
  delegateEmail: string;
  /** Name of the delegate */
  delegateName: string;
  /** Reason for delegation (optional) */
  reason?: string;
  /** Expiration date for the delegation (optional) */
  expiresAt?: string;
  /** Additional metadata for the delegation (optional) */
  metadata?: Record<string, unknown>;
  /** Actor context information (optional) */
  actor?: ActorContext;
}

/**
 * Result of consent delegation
 */
export interface DelegateConsentResult {
  /** The unique identifier of the consent */
  consentId: ConsentId;
  /** The unique identifier of the delegation */
  delegationId: string;
  /** ISO timestamp when the consent was delegated */
  delegatedAt: string;
}

/**
 * Result of consent submission
 */
export interface SubmitConsentResult {
  /** The unique identifier of the consent */
  consentId: ConsentId;
  /** ISO timestamp when the consent was submitted */
  submittedAt: string;
}

/**
 * Port interface for consent command operations
 * 
 * This port defines the contract for write-oriented consent operations.
 * Implementations should handle the business logic for creating, updating,
 * deleting, submitting, and delegating consents.
 */
export interface ConsentCommandsPort {
  /**
   * Creates a new consent
   * 
   * @param input - The consent creation parameters
   * @returns Promise resolving to the created consent data
   */
  create(input: CreateConsentCommand): Promise<CreateConsentResult>;

  /**
   * Updates an existing consent
   * 
   * @param envelopeId - The envelope ID this consent belongs to
   * @param consentId - The unique identifier of the consent to update
   * @param patch - The data to update the consent with
   * @returns Promise resolving to the updated consent data
   */
  update(envelopeId: EnvelopeId, consentId: ConsentId, patch: ConsentPatch): Promise<UpdateConsentResult>;

  /**
   * Deletes a consent
   * 
   * @param envelopeId - The envelope ID this consent belongs to
   * @param consentId - The unique identifier of the consent to delete
   * @returns Promise resolving when deletion is complete
   */
  delete(envelopeId: EnvelopeId, consentId: ConsentId): Promise<void>;

  /**
   * Submits a consent
   * 
   * @param envelopeId - The envelope ID this consent belongs to
   * @param consentId - The unique identifier of the consent to submit
   * @param actor - Actor context information (optional)
   * @returns Promise resolving to the submitted consent data
   */
  submit(envelopeId: EnvelopeId, consentId: ConsentId, actor?: ActorContext): Promise<SubmitConsentResult>;

  /**
   * Delegates a consent to another party
   * 
   * @param input - The consent delegation parameters
   * @returns Promise resolving to the delegated consent data
   */
  delegate(input: DelegateConsentCommand): Promise<DelegateConsentResult>;
}
