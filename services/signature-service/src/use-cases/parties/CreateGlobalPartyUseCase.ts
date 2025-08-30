/**
 * @file CreateGlobalPartyUseCase.ts
 * @summary Use case for creating a new global party in the address book
 * @description Handles the business logic for creating a global party including validation,
 * domain rules enforcement, and coordination with the global parties commands port.
 */

import type { CreateGlobalPartyInput, CreateGlobalPartyResult, GlobalPartiesCommandsPort } from "../../app/ports/parties/GlobalPartiesCommandsPort";
import type { GlobalPartiesQueriesPort } from "../../app/ports/parties/GlobalPartiesQueriesPort";
import { badRequest } from "../../shared/errors";
import { toPartyEmail } from "../../domain/value-objects/party/PartyEmail";
import { toPartyPhone } from "../../domain/value-objects/party/PartyPhone";
import { PersonNameSchema } from "../../domain/value-objects/PersonName";
import { validatePartyCreationFields } from "../shared/GlobalPartyValidations";

/**
 * Input parameters for the CreateGlobalParty use case
 * @interface CreateGlobalPartyUseCaseInput
 * @description Data required to create a new global party
 */
export interface CreateGlobalPartyUseCaseInput {
  /** The tenant ID that owns the party */
  tenantId: string;
  /** The email address of the party */
  email: string;
  /** The display name of the party */
  name: string;
  /** Optional phone number of the party (USA format) */
  phone?: string;
  /** The role assigned to the party */
  role: string;
  /** The source of the party (manual, import, etc.) */
  source?: string;
  /** Optional metadata associated with the party */
  metadata?: Record<string, unknown>;
  /** Notification preferences for the party */
  notificationPreferences?: {
    /** Whether to send email notifications */
    email: boolean;
    /** Whether to send SMS notifications */
    sms: boolean;
  };
}

/**
 * Result of the CreateGlobalParty use case
 * @interface CreateGlobalPartyUseCaseResult
 * @description Contains the created party information
 */
export interface CreateGlobalPartyUseCaseResult {
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
 * Dependencies required by the CreateGlobalParty use case
 * @interface CreateGlobalPartyUseCaseDeps
 * @description External dependencies needed for the use case execution
 */
export interface CreateGlobalPartyUseCaseDeps {
  /** Port for global party command operations */
  globalPartiesCommands: GlobalPartiesCommandsPort;
  /** Port for global party query operations */
  globalPartiesQueries: GlobalPartiesQueriesPort;
}

/**
 * Use case for creating a new global party
 * @class CreateGlobalPartyUseCase
 * @description Handles the business logic for creating a global party in the address book
 */
export class CreateGlobalPartyUseCase {
  constructor(private readonly deps: CreateGlobalPartyUseCaseDeps) {}

  /**
   * Execute the create global party use case
   * @param input - The input data for creating a global party
   * @returns Promise resolving to the creation result
   * @throws {BadRequestError} When input validation fails
   * @throws {ConflictError} When email already exists in tenant
   */
  async execute(input: CreateGlobalPartyUseCaseInput): Promise<CreateGlobalPartyUseCaseResult> {
    // Validate input parameters
    this.validateInput(input);

    // Validate email format and uniqueness
    const email = toPartyEmail(input.email, input.tenantId as any);
    
    // Check if email already exists
    const existingParty = await this.deps.globalPartiesQueries.findByEmail({
      tenantId: input.tenantId as any,
      email: email.toString(),
    });
    
    if (existingParty) {
      throw badRequest(`Party with email ${email.toString()} already exists in this tenant`);
    }

    // Validate name
    const name = PersonNameSchema.parse({ display: input.name });

    // Validate phone if provided
    let phone: any = undefined;
    if (input.phone) {
      phone = toPartyPhone(input.phone);
    }

    // Prepare command input
    const commandInput: CreateGlobalPartyInput = {
      tenantId: input.tenantId as any,
      email: email.toString(),
      name: name.display,
      phone: phone,
      role: input.role as any,
      source: input.source as any,
      metadata: input.metadata as any,
      notificationPreferences: input.notificationPreferences,
    };

    // Execute command
    const result = await this.deps.globalPartiesCommands.create(commandInput);

    // Transform result to use case format
    return {
      partyId: result.partyId,
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
  private validateInput(input: CreateGlobalPartyUseCaseInput): void {
    validatePartyCreationFields(
      input.tenantId,
      input.email,
      input.name,
      input.role,
      input.notificationPreferences
    );
  }
}
