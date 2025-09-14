/**
 * @file ConsentPartyHelpers.ts
 * @summary Helper functions for party operations in consent services
 * @description Common helper functions for party creation and management in consent delegation
 */

import type { GlobalPartiesRepository } from "../../../domain/contracts/repositories/global-parties/GlobalPartiesRepository";
import type { FindOrCreatePartyInput } from "../../../domain/types/global-parties";
import type { PartyId } from "../../../domain/value-objects/ids";
import { PARTY_ROLES, PARTY_SOURCES, PARTY_STATUSES } from "../../../domain/values/enums";
import { BadRequestError } from "../../../shared/errors";

/**
 * @summary Creates a default party configuration for delegation
 * @description Centralized party configuration for consent delegation
 * 
 * @param partyId - Party ID * @param email - Party email
 * @param name - Party name
 * @returns Party creation object with default configuration
 */
export function createDefaultPartyForDelegation(
  partyId: PartyId,
  email: string,
  name: string
) {
  return {
    partyId,
    email,
    name,
    role: PARTY_ROLES[0], // "signer" - Default role for delegates
    source: PARTY_SOURCES[0], // "manual" - Default source
    status: PARTY_STATUSES[5], // "active" - Default status
    preferences: {
      defaultAuth: undefined, // No default auth method
      defaultLocale: undefined},
    notificationPreferences: {
      email: true,
      sms: false},
    stats: {
      signedCount: 0,
      totalEnvelopes: 0},
    metadata: {
      createdFor: "consent-delegation",
      originalEmail: email,
      originalName: name
    }
  };
}

/**
 * @summary Finds an existing party by email or creates a new one for delegation
 * @description Centralized party lookup and creation logic for consent delegation
 * 
 * @param globalPartiesRepo - Global parties repository
 * @param ids - ID generator
 * @param input - Party lookup/creation input
 * @returns Promise resolving to the party ID (existing or newly created)
 * 
 * @throws BadRequestError if email or name are invalid
 */
export async function findOrCreatePartyForDelegation(
  globalPartiesRepo: GlobalPartiesRepository,
  ids: { ulid(): string },
  input: FindOrCreatePartyInput
): Promise<PartyId> {
  // Validate input
  if (!input.email?.trim() || !input.name?.trim()) {
    throw new BadRequestError("Email and name are required for party delegation");
  }

  // First, try to find existing party by email
  const existingParty = await globalPartiesRepo.findByEmail({
    email: input.email
  });

  if (existingParty?.party) {
    return existingParty.party.partyId;
  }

  // If not found, create a new party for the delegate
  const newPartyId = ids.ulid() as PartyId;
  
  const partyData = createDefaultPartyForDelegation(
    newPartyId,
    input.email,
    input.name
  );

  await globalPartiesRepo.create(partyData);

  return newPartyId;
};
