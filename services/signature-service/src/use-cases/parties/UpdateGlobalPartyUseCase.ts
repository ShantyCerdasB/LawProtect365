/**
 * @file UpdateGlobalPartyUseCase.ts
 * @summary Use case for updating an existing global party in the address book
 * @description Handles the business logic for updating a global party including validation,
 * domain rules enforcement, and coordination with the global parties commands port.
 */

import type { UpdateGlobalPartyInput, UpdateGlobalPartyResult, GlobalPartiesCommandsPort } from "../../app/ports/parties/GlobalPartiesCommandsPort";
import type { GlobalPartiesQueriesPort } from "../../app/ports/parties/GlobalPartiesQueriesPort";
import { assertPartyIsActive } from "../../domain/rules/GlobalParties.rules";
import { badRequest, partyNotFound } from "../../errors";
import { toPartyPhone } from "../../domain/value-objects/party/PartyPhone";
import { PersonNameSchema } from "../../domain/value-objects/PersonName";
import { validatePartyUpdateFields } from "../shared/GlobalPartyValidations";

/**
 * Input parameters for the UpdateGlobalParty use case
 * @interface UpdateGlobalPartyUseCaseInput
 * @description Data required to update an existing global party
 */
export interface UpdateGlobalPartyUseCaseInput {
  /** The tenant ID that owns the party */
  tenantId: string;
  /** The unique identifier of the party to update */
  partyId: string;
  /** The fields to update */
  updates: {
    /** The display name of the party */
    name?: string;
    /** The phone number of the party (USA format) */
    phone?: string;
    /** The role assigned to the party */
    role?: string;
    /** Optional metadata associated with the party */
    metadata?: Record<string, unknown>;
    /** Notification preferences for the party */
    notificationPreferences?: {
      /** Whether to send email notifications */
      email: boolean;
      /** Whether to send SMS notifications */
      sms: boolean;
    };
  };
}

/**
 * Result of the UpdateGlobalParty use case
 * @interface UpdateGlobalPartyUseCaseResult
 * @description Contains the updated party information
 */
export interface UpdateGlobalPartyUseCaseResult {
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
 * Dependencies required by the UpdateGlobalParty use case
 * @interface UpdateGlobalPartyUseCaseDeps
 * @description External dependencies needed for the use case execution
 */
export interface UpdateGlobalPartyUseCaseDeps {
  /** Port for global party command operations */
  globalPartiesCommands: GlobalPartiesCommandsPort;
  /** Port for global party query operations */
  globalPartiesQueries: GlobalPartiesQueriesPort;
}

/**
 * Use case for updating an existing global party
 * @class UpdateGlobalPartyUseCase
 * @description Handles the business logic for updating a global party in the address book
 */
export class UpdateGlobalPartyUseCase {
  constructor(private readonly deps: UpdateGlobalPartyUseCaseDeps) {}

  /**
   * Execute the update global party use case
   * @param input - The input data for updating a global party
   * @returns Promise resolving to the update result
   * @throws {BadRequestError} When input validation fails
   * @throws {NotFoundError} When party is not found
   * @throws {ConflictError} When party is not active
   */
  async execute(input: UpdateGlobalPartyUseCaseInput): Promise<UpdateGlobalPartyUseCaseResult> {
    // Validate input parameters
    this.validateInput(input);

    // Check if party exists and belongs to tenant
    const existingParty = await this.deps.globalPartiesQueries.getById({
      tenantId: input.tenantId as any,
      partyId: input.partyId as any,
    });

    if (!existingParty) {
      throw partyNotFound();
    }

    if (existingParty.tenantId !== input.tenantId) {
      throw badRequest("Party does not belong to this tenant");
    }

    // Ensure party is active
    assertPartyIsActive(existingParty);

    // Validate and prepare updates
    const updates: any = {};

    if (input.updates.name !== undefined) {
      const name = PersonNameSchema.parse({ display: input.updates.name });
      updates.name = name.display;
    }

    if (input.updates.phone !== undefined) {
      if (input.updates.phone === null || input.updates.phone === "") {
        updates.phone = undefined;
      } else {
        const phone = toPartyPhone(input.updates.phone);
        updates.phone = phone;
      }
    }

    if (input.updates.role !== undefined) {
      updates.role = input.updates.role;
    }

    if (input.updates.metadata !== undefined) {
      updates.metadata = input.updates.metadata;
    }

    if (input.updates.notificationPreferences !== undefined) {
      updates.notificationPreferences = input.updates.notificationPreferences;
    }

    // Prepare command input
    const commandInput: UpdateGlobalPartyInput = {
      tenantId: input.tenantId as any,
      partyId: input.partyId as any,
      updates,
    };

    // Execute command
    const result = await this.deps.globalPartiesCommands.update(commandInput);

    // Transform result to use case format
    return {
      party: {
        id: result.party.id,
        tenantId: result.party.tenantId,
        name: result.party.name,
        email: result.party.email,
        phone: result.party.phone,
        role: result.party.role,
        source: result.party.source,
        status: result.party.status,
        metadata: result.party.metadata,
        notificationPreferences: result.party.notificationPreferences,
        createdAt: result.party.createdAt,
        updatedAt: result.party.updatedAt,
      },
    };
  }

  /**
   * Validate the input parameters
   * @param input - The input data to validate
   * @throws {BadRequestError} When validation fails
   */
  private validateInput(input: UpdateGlobalPartyUseCaseInput): void {
    validatePartyUpdateFields(
      input.tenantId,
      input.partyId,
      input.updates
    );
  }
}
