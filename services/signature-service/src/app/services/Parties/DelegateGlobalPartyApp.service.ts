/**
 * @file DelegateGlobalPartyApp.service.ts
 * @summary App service for delegating global parties
 * @description Orchestrates the delegation of global parties by delegating to the use case
 */

import type { DelegateGlobalPartyUseCase } from "../../../use-cases/parties/DelegateGlobalPartyUseCase";

/**
 * Input parameters for the DelegateGlobalParty app service
 * @interface DelegateGlobalPartyAppInput
 * @description Data required to delegate a global party
 */
export interface DelegateGlobalPartyAppInput {
  /** The tenant ID that owns the original party */
  tenantId: string;
  /** The unique identifier of the original party being delegated */
  originalPartyId: string;
  /** The email address of the delegate */
  delegateEmail: string;
  /** The name of the delegate */
  delegateName: string;
  /** The reason for the delegation */
  reason: string;
  /** The type of delegation */
  type: string;
  /** Optional expiration date for the delegation */
  expiresAt?: string;
  /** Optional metadata associated with the delegation */
  metadata?: Record<string, unknown>;
}

/**
 * Result of the DelegateGlobalParty app service
 * @interface DelegateGlobalPartyAppResult
 * @description Contains the delegation and delegate party information
 */
export interface DelegateGlobalPartyAppResult {
  /** The unique identifier of the created delegation */
  delegationId: string;
  /** The complete delegation data */
  delegation: {
    /** The unique identifier of the delegation */
    id: string;
    /** The tenant ID that owns the delegation */
    tenantId: string;
    /** The ID of the original party being delegated */
    originalPartyId: string;
    /** The ID of the delegate party */
    delegatePartyId: string;
    /** The reason for the delegation */
    reason: string;
    /** The type of delegation */
    type: string;
    /** Optional expiration date for the delegation */
    expiresAt?: string;
    /** Optional metadata associated with the delegation */
    metadata?: Record<string, unknown>;
    /** ISO timestamp when the delegation was created */
    createdAt: string;
  };
  /** The complete delegate party data */
  delegateParty: {
    /** The unique identifier of the delegate party */
    id: string;
    /** The tenant ID that owns the delegate party */
    tenantId: string;
    /** The display name of the delegate party */
    name: string;
    /** The email address of the delegate party */
    email: string;
    /** Optional phone number of the delegate party */
    phone?: string;
    /** The role assigned to the delegate party */
    role: string;
    /** The source of the delegate party */
    source: string;
    /** The status of the delegate party */
    status: string;
    /** Optional metadata associated with the delegate party */
    metadata?: Record<string, unknown>;
    /** Notification preferences for the delegate party */
    notificationPreferences: {
      /** Whether to send email notifications */
      email: boolean;
      /** Whether to send SMS notifications */
      sms: boolean;
    };
    /** ISO timestamp when the delegate party was created */
    createdAt: string;
    /** ISO timestamp when the delegate party was last updated */
    updatedAt: string;
  };
}

/**
 * Dependencies required by the DelegateGlobalParty app service
 * @interface DelegateGlobalPartyAppDependencies
 * @description External dependencies needed for the app service execution
 */
export interface DelegateGlobalPartyAppDependencies {
  /** Use case for delegating global parties */
  delegateGlobalPartyUseCase: DelegateGlobalPartyUseCase;
}

/**
 * Delegates a global party using the provided use case
 * @param input - The input data for delegating a global party
 * @param deps - Dependencies required for the operation
 * @returns Promise resolving to the delegation result
 */
export const delegateGlobalPartyApp = async (
  input: DelegateGlobalPartyAppInput,
  deps: DelegateGlobalPartyAppDependencies
): Promise<DelegateGlobalPartyAppResult> => {
  const result = await deps.delegateGlobalPartyUseCase.execute({
    tenantId: input.tenantId,
    originalPartyId: input.originalPartyId,
    delegateEmail: input.delegateEmail,
    delegateName: input.delegateName,
    reason: input.reason,
    type: input.type,
    expiresAt: input.expiresAt,
    metadata: input.metadata,
  });

  return {
    delegationId: result.delegationId,
    delegation: result.delegation,
    delegateParty: result.delegateParty,
  };
};
