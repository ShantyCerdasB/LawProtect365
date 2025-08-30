/**
 * @file DelegateGlobalPartyUseCase.ts
 * @summary Use case for delegating a global party to another party
 * @description Handles the business logic for creating delegations between global parties including validation,
 * domain rules enforcement, and coordination with the global parties commands port.
 */

import type { CreateDelegationInput, CreateDelegationResult, GlobalPartiesCommandsPort } from "../../app/ports/parties/GlobalPartiesCommandsPort";
import type { GlobalPartiesQueriesPort } from "../../app/ports/parties/GlobalPartiesQueriesPort";
import { assertPartyIsActive, assertValidDelegation } from "../../domain/rules/GlobalParties.rules";
import { badRequest, partyNotFound } from "../../errors";
import { toPartyEmail } from "../../domain/value-objects/party/PartyEmail";
import { PersonNameSchema } from "../../domain/value-objects/PersonName";
import { validateDelegationCreationFields, validateRequiredString } from "../shared/GlobalPartyValidations";

/**
 * Input parameters for the DelegateGlobalParty use case
 * @interface DelegateGlobalPartyUseCaseInput
 * @description Data required to create a delegation for a global party
 */
export interface DelegateGlobalPartyUseCaseInput {
  /** The tenant ID that owns the original party */
  tenantId: string;
  /** The unique identifier of the original party being delegated */
  originalPartyId: string;
  /** The email address of the delegate */
  delegateEmail: string;
  /** The display name of the delegate */
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
 * Result of the DelegateGlobalParty use case
 * @interface DelegateGlobalPartyUseCaseResult
 * @description Contains the created delegation information
 */
export interface DelegateGlobalPartyUseCaseResult {
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
    /** The status of the delegation */
    status: string;
    /** Optional expiration date for the delegation */
    expiresAt?: string;
    /** Optional metadata associated with the delegation */
    metadata?: Record<string, unknown>;
    /** ISO timestamp when the delegation was created */
    createdAt: string;
  };
  /** The delegate party data */
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
 * Dependencies required by the DelegateGlobalParty use case
 * @interface DelegateGlobalPartyUseCaseDeps
 * @description External dependencies needed for the use case execution
 */
export interface DelegateGlobalPartyUseCaseDeps {
  /** Port for global party command operations */
  globalPartiesCommands: GlobalPartiesCommandsPort;
  /** Port for global party query operations */
  globalPartiesQueries: GlobalPartiesQueriesPort;
}

/**
 * Use case for delegating a global party
 * @class DelegateGlobalPartyUseCase
 * @description Handles the business logic for creating delegations between global parties
 */
export class DelegateGlobalPartyUseCase {
  constructor(private readonly deps: DelegateGlobalPartyUseCaseDeps) {}

  /**
   * Execute the delegate global party use case
   * @param input - The input data for creating a delegation
   * @returns Promise resolving to the delegation creation result
   * @throws {BadRequestError} When input validation fails
   * @throws {NotFoundError} When original party is not found
   * @throws {ConflictError} When delegation parameters are invalid
   */
  async execute(input: DelegateGlobalPartyUseCaseInput): Promise<DelegateGlobalPartyUseCaseResult> {
    // Validate input parameters
    this.validateInput(input);

    // Check if original party exists and belongs to tenant
    const originalParty = await this.deps.globalPartiesQueries.getById({
      tenantId: input.tenantId as any,
      partyId: input.originalPartyId as any,
    });

    if (!originalParty) {
      throw partyNotFound();
    }

    if (originalParty.tenantId !== input.tenantId) {
      throw badRequest("Original party does not belong to this tenant");
    }

    // Ensure original party is active
    assertPartyIsActive(originalParty);

    // Validate delegation parameters
    const delegateEmail = toPartyEmail(input.delegateEmail, input.tenantId as any);
    assertValidDelegation(
      input.originalPartyId as any,
      delegateEmail,
      input.reason,
      input.type as any,
      input.expiresAt
    );

    // Validate delegate name
    const delegateName = PersonNameSchema.parse({ display: input.delegateName });

    // Prepare command input
    const commandInput: CreateDelegationInput = {
      tenantId: input.tenantId as any,
      originalPartyId: input.originalPartyId as any,
      delegateEmail: delegateEmail.toString(),
      delegateName: delegateName.display,
      reason: input.reason,
      type: input.type as any,
      expiresAt: input.expiresAt,
      metadata: input.metadata as any,
    };

    // Execute command
    const result = await this.deps.globalPartiesCommands.createDelegation(commandInput);

    // Transform result to use case format
    return {
      delegationId: result.delegationId,
      delegation: {
        id: result.delegation.id,
        tenantId: result.delegation.tenantId,
        originalPartyId: result.delegation.originalPartyId,
        delegatePartyId: result.delegation.delegatePartyId,
        reason: result.delegation.reason,
        type: result.delegation.type,
        status: "active", // Delegations are active by default
        expiresAt: result.delegation.expiresAt,
        metadata: result.delegation.metadata,
        createdAt: result.delegation.createdAt,
      },
      delegateParty: {
        id: result.delegateParty.id,
        tenantId: result.delegateParty.tenantId,
        name: result.delegateParty.name,
        email: result.delegateParty.email,
        phone: result.delegateParty.phone,
        role: result.delegateParty.role,
        source: result.delegateParty.source,
        status: result.delegateParty.status,
        metadata: result.delegateParty.metadata,
        notificationPreferences: result.delegateParty.notificationPreferences,
        createdAt: result.delegateParty.createdAt,
        updatedAt: result.delegateParty.updatedAt,
      },
    };
  }

  /**
   * Validate the input parameters
   * @param input - The input data to validate
   * @throws {BadRequestError} When validation fails
   */
  private validateInput(input: DelegateGlobalPartyUseCaseInput): void {
    validateDelegationCreationFields(
      input.tenantId,
      input.originalPartyId,
      input.delegateEmail,
      input.delegateName,
      input.reason,
      input.type
    );

    if (input.expiresAt !== undefined) {
      validateRequiredString(input.expiresAt, "Expiration date");
    }
  }
}
