/**
 * @file CreateGlobalPartyApp.service.ts
 * @summary App service for creating global parties
 * @description Orchestrates the creation of global parties by delegating to the use case
 */

import type { CreateGlobalPartyUseCase } from "../../../use-cases/parties/CreateGlobalPartyUseCase";
import type { ActorContext } from "../../ports/shared";

/**
 * Input parameters for the CreateGlobalParty app service
 * @interface CreateGlobalPartyAppInput
 * @description Data required to create a global party
 */
export interface CreateGlobalPartyAppInput {
  /** The tenant ID that will own the party */
  tenantId: string;
  /** The email address of the party */
  email: string;
  /** The full name of the party */
  name: string;
  /** Optional phone number of the party */
  phone?: string;
  /** The role assigned to the party */
  role: string;
  /** The source of the party */
  source: string;
  /** Optional metadata for additional information */
  metadata?: Record<string, unknown>;
  /** Optional notification preferences */
  notificationPreferences?: {
    /** Whether to send email notifications */
    email: boolean;
    /** Whether to send SMS notifications */
    sms: boolean;
  };
}

/**
 * Result of the CreateGlobalParty app service
 * @interface CreateGlobalPartyAppResult
 * @description Contains the created party information
 */
export interface CreateGlobalPartyAppResult {
  /** The unique identifier of the created party */
  partyId: string;
  /** The complete party data */
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
 * Dependencies required by the CreateGlobalParty app service
 * @interface CreateGlobalPartyAppDependencies
 * @description External dependencies needed for the app service execution
 */
export interface CreateGlobalPartyAppDependencies {
  /** Use case for creating global parties */
  createGlobalPartyUseCase: CreateGlobalPartyUseCase;
}

/**
 * Creates a global party using the provided use case
 * @param input - The input data for creating a global party
 * @param deps - Dependencies required for the operation
 * @returns Promise resolving to the creation result
 */
export const createGlobalPartyApp = async (
  input: CreateGlobalPartyAppInput,
  deps: CreateGlobalPartyAppDependencies
): Promise<CreateGlobalPartyAppResult> => {
  const result = await deps.createGlobalPartyUseCase.execute({
    tenantId: input.tenantId,
    email: input.email,
    name: input.name,
    phone: input.phone,
    role: input.role,
    source: input.source,
    metadata: input.metadata,
    notificationPreferences: input.notificationPreferences,
  });

  return {
    partyId: result.partyId,
    party: result.party,
  };
};
