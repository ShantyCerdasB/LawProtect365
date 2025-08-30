/**
 * @file UpdateGlobalPartyApp.service.ts
 * @summary App service for updating global parties
 * @description Orchestrates the update of global parties by delegating to the use case
 */

import type { UpdateGlobalPartyUseCase } from "../../../use-cases/parties/UpdateGlobalPartyUseCase";

/**
 * Input parameters for the UpdateGlobalParty app service
 * @interface UpdateGlobalPartyAppInput
 * @description Data required to update a global party
 */
export interface UpdateGlobalPartyAppInput {
  /** The tenant ID that owns the party */
  tenantId: string;
  /** The unique identifier of the party to update */
  partyId: string;
  /** The fields to update */
  updates: {
    /** Optional new name for the party */
    name?: string;
    /** Optional new phone number for the party */
    phone?: string;
    /** Optional new role for the party */
    role?: string;
    /** Optional new source for the party */
    source?: string;
    /** Optional metadata updates */
    metadata?: Record<string, unknown>;
    /** Optional notification preferences updates */
    notificationPreferences?: {
      /** Whether to send email notifications */
      email: boolean;
      /** Whether to send SMS notifications */
      sms: boolean;
    };
  };
}

/**
 * Result of the UpdateGlobalParty app service
 * @interface UpdateGlobalPartyAppResult
 * @description Contains the updated party information
 */
export interface UpdateGlobalPartyAppResult {
  /** The complete updated party data */
  party: {
    /** The unique identifier of the party */
    id: string;
    /** The tenant ID that owns the party */
    tenantId: string;
    /** The display name of the party */
    name: string;
    /** The email address of the party */
    email: string;
    /** Optional phone number of the party */
    phone?: string;
    /** The role assigned to the party */
    role: string;
    /** The source of the party */
    source: string;
    /** The status of the party */
    status: string;
    /** Optional metadata associated with the party */
    metadata?: Record<string, unknown>;
    /** Notification preferences for the party */
    notificationPreferences: {
      /** Whether to send email notifications */
      email: boolean;
      /** Whether to send SMS notifications */
      sms: boolean;
    };
    /** ISO timestamp when the party was created */
    createdAt: string;
    /** ISO timestamp when the party was last updated */
    updatedAt: string;
  };
}

/**
 * Dependencies required by the UpdateGlobalParty app service
 * @interface UpdateGlobalPartyAppDependencies
 * @description External dependencies needed for the app service execution
 */
export interface UpdateGlobalPartyAppDependencies {
  /** Use case for updating global parties */
  updateGlobalPartyUseCase: UpdateGlobalPartyUseCase;
}

/**
 * Updates a global party using the provided use case
 * @param input - The input data for updating a global party
 * @param deps - Dependencies required for the operation
 * @returns Promise resolving to the update result
 */
export const updateGlobalPartyApp = async (
  input: UpdateGlobalPartyAppInput,
  deps: UpdateGlobalPartyAppDependencies
): Promise<UpdateGlobalPartyAppResult> => {
  const result = await deps.updateGlobalPartyUseCase.execute({
    tenantId: input.tenantId,
    partyId: input.partyId,
    updates: input.updates,
  });

  return {
    party: result.party,
  };
};
