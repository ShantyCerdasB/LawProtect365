/**
 * @file CreatePartyUseCase.ts
 * @summary Use case for creating a Party in an envelope
 * @description Use case for creating a new Party within an envelope.
 * Handles validation, business rules, and sequence management.
 */

import type { Party } from "@/domain/entities/Party";
import type { PartiesCommandsPort, PartiesQueriesPort } from "@/app/ports/parties";
import type { CreatePartyCommand, CreatePartyResult } from "@/app/ports/parties";
import { badRequest, conflict } from "@/errors";
import { DEFAULT_PARTY_AUTH } from "@/domain/value-objects/party/PartyAuth";
import { getNextSequence } from "@/domain/value-objects/party/PartySequence";

/**
 * @description Dependencies for the CreateParty use case.
 */
export interface CreatePartyUseCaseDeps {
  partiesCommands: PartiesCommandsPort;
  partiesQueries: PartiesQueriesPort;
}

/**
 * @description Input for the CreateParty use case.
 */
export interface CreatePartyUseCaseInput {
  tenantId: string;
  envelopeId: string;
  name: string;
  email: string;
  role: string;
  sequence?: number;
  phone?: string;
  locale?: string;
  auth?: {
    methods: string[];
  };
  globalPartyId?: string;
  actor: {
    userId?: string;
    email?: string;
    ip?: string;
    userAgent?: string;
    locale?: string;
  };
}

/**
 * @description Result of the CreateParty use case.
 */
export interface CreatePartyUseCaseResult {
  party: Party;
}

/**
 * @description Creates a new Party within an envelope.
 * 
 * @param input - The input data for creating a Party
 * @param deps - The dependencies for the use case
 * @returns Promise resolving to the created Party
 * @throws {BadRequestError} When input validation fails
 * @throws {ConflictError} When a Party with the same email already exists in the envelope
 */
export const executeCreateParty = async (
  input: CreatePartyUseCaseInput,
  deps: CreatePartyUseCaseDeps
): Promise<CreatePartyUseCaseResult> => {
  // 1. Validate input
  if (!input.name.trim()) {
    throw badRequest("Name is required");
  }

  if (!input.email.trim()) {
    throw badRequest("Email is required");
  }

  if (!input.role) {
    throw badRequest("Role is required");
  }

  // 2. Check if Party with same email already exists in the envelope
  const existingResult = await deps.partiesQueries.getByEmail({
    tenantId: input.tenantId,
    envelopeId: input.envelopeId,
    email: input.email,
  });

  if (existingResult.parties.length > 0) {
    throw conflict(`Party with email ${input.email} already exists in this envelope`);
  }

  // 3. Get next sequence number if not provided
  let sequence = input.sequence;
  if (!sequence) {
    const existingParties = await deps.partiesQueries.list({
      tenantId: input.tenantId,
      envelopeId: input.envelopeId,
      limit: 100, // Get all parties to calculate sequence
    });
    
    const existingSequences = existingParties.parties.map(p => p.sequence);
    sequence = getNextSequence(existingSequences);
  }

  // 4. Prepare command
  const command: CreatePartyCommand = {
    tenantId: input.tenantId,
    envelopeId: input.envelopeId,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    role: input.role as any,
    sequence,
    phone: input.phone?.trim(),
    locale: input.locale?.trim(),
    auth: input.auth ? { methods: input.auth.methods as any[] } : DEFAULT_PARTY_AUTH,
    globalPartyId: input.globalPartyId,
    actor: input.actor,
  };

  // 5. Execute command
  const result: CreatePartyResult = await deps.partiesCommands.create(command);

  return {
    party: result.party,
  };
};
