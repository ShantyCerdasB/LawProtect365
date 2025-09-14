/**
 * @file InvitationsRepository.ts
 * @summary Repository interface for invitation management
 * @description Defines the contract for invitation data access operations
 */

import { Invitation, CreateInvitationInput, UpdateInvitationInput, InvitationQueryInput } from "../../../entities/Invitation";

/**
 * @summary Invitation repository interface
 * @description Contract for invitation data access operations
 */
export interface InvitationsRepository {
  /**
   * Create a new invitation
   * @param invitation - Invitation data to create
   * @returns Promise resolving to the created invitation
   */
  create(invitation: CreateInvitationInput): Promise<Invitation>;

  /**
   * Get an invitation by its ID
   * @param invitationId - Unique identifier of the invitation
   * @returns Promise resolving to the invitation or null if not found
   */
  getById(invitationId: string): Promise<Invitation | null>;

  /**
   * Get an invitation by its token
   * @param token - Unique token of the invitation
   * @returns Promise resolving to the invitation or null if not found
   */
  getByToken(token: string): Promise<Invitation | null>;

  /**
   * Get all invitations for a specific envelope
   * @param envelopeId - ID of the envelope
   * @returns Promise resolving to array of invitations
   */
  getByEnvelope(envelopeId: string): Promise<Invitation[]>;

  /**
   * Get invitations by email address
   * @param email - Email address to search for
   * @returns Promise resolving to array of invitations
   */
  getByEmail(email: string): Promise<Invitation[]>;

  /**
   * Update an existing invitation
   * @param invitation - Updated invitation data
   * @returns Promise resolving to the updated invitation
   */
  update(invitation: UpdateInvitationInput): Promise<Invitation>;

  /**
   * Delete an invitation by its ID
   * @param invitationId - Unique identifier of the invitation to delete
   * @returns Promise resolving when deletion is complete
   */
  delete(invitationId: string): Promise<void>;

  /**
   * Query invitations with filters
   * @param query - Query parameters for filtering invitations
   * @returns Promise resolving to array of matching invitations
   */
  query(query: InvitationQueryInput): Promise<Invitation[]>;
}
