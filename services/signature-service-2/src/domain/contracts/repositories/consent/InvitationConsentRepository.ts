/**
 * @file InvitationConsentRepository.ts
 * @summary Repository interface for invitation consent management
 * @description Defines the contract for invitation consent data access operations
 */

import { 
  InvitationConsent, 
  CreateInvitationConsentInput, 
  InvitationConsentQueryInput 
} from "../../../entities/InvitationConsent";

/**
 * @summary Invitation consent repository interface
 * @description Contract for invitation consent data access operations
 */
export interface InvitationConsentRepository {
  /**
   * Create a new consent record
   * @param consent - Consent data to create
   * @returns Promise resolving to the created consent record
   */
  create(consent: CreateInvitationConsentInput): Promise<InvitationConsent>;

  /**
   * Get a consent record by its ID
   * @param consentId - Unique identifier of the consent record
   * @returns Promise resolving to the consent record or null if not found
   */
  getById(consentId: string): Promise<InvitationConsent | null>;

  /**
   * Get a consent record by invitation token
   * @param invitationToken - Token of the invitation
   * @returns Promise resolving to the consent record or null if not found
   */
  getByToken(invitationToken: string): Promise<InvitationConsent | null>;

  /**
   * Get all consent records for a specific envelope
   * @param envelopeId - ID of the envelope
   * @returns Promise resolving to array of consent records
   */
  getByEnvelope(envelopeId: string): Promise<InvitationConsent[]>;

  /**
   * Get consent records by email address
   * @param email - Email address to search for
   * @returns Promise resolving to array of consent records
   */
  getByEmail(email: string): Promise<InvitationConsent[]>;

  /**
   * Query consent records with filters
   * @param query - Query parameters for filtering consent records
   * @returns Promise resolving to array of matching consent records
   */
  query(query: InvitationConsentQueryInput): Promise<InvitationConsent[]>;

  /**
   * Delete a consent record by its ID
   * @param consentId - Unique identifier of the consent record to delete
   * @returns Promise resolving when deletion is complete
   */
  delete(consentId: string): Promise<void>;
}
