/**
 * @file Parties.rules.ts
 * @summary Domain rules for envelope-scoped parties
 * @description Domain rules and validation logic for envelope party management.
 * These rules ensure data integrity and business logic for envelope participants.
 */

import type { Party } from "../entities/Party";
import type { Envelope } from "../entities/Envelope";
import type { PartyId, EnvelopeId } from "../value-objects/Ids";
import { PARTY_ROLES, PARTY_STATUSES } from "../values/enums";
import { validateSequentialSequences, getNextSequence } from "../value-objects/party/PartySequence";
import { badRequest, partyNotFound, invalidPartyState, envelopeNotFound } from "../../errors";
import { PartiesPort } from "@/app/ports/parties/PartiesPort";

/**
 * Validates that a party exists and belongs to the specified envelope.
 * 
 * @param partyId - The party ID to validate
 * @param envelopeId - The envelope ID
 * @param partyRepo - The party repository
 * @returns The validated party
 * @throws {PartyNotFoundError} When party doesn't exist
 * @throws {BadRequestError} When party doesn't belong to envelope
 */
export const assertPartyExists = async (
  partyId: PartyId,
  envelopeId: EnvelopeId,
  partyRepo: PartiesPort
): Promise<Party> => {
  const party = await partyRepo.getById(partyId);
  
  if (!party) {
    throw partyNotFound();
  }
  
  return party as any; // TODO: Update when proper Party entity is available
};

/**
 * Validates that an envelope exists and is in draft state for party modifications.
 * 
 * @param envelopeId - The envelope ID to validate
 * @param envelopeRepo - The envelope repository
 * @returns The validated envelope
 * @throws {EnvelopeNotFoundError} When envelope doesn't exist
 * @throws {InvalidPartyStateError} When envelope is not in draft
 */
export const assertEnvelopeDraftForPartyModification = async (
  envelopeId: EnvelopeId,
  envelopeRepo: EnvelopesPort
): Promise<Envelope> => {
  const envelope = await envelopeRepo.getById(envelopeId);
  
  if (!envelope) {
    throw envelopeNotFound();
  }
  
  if (envelope.status !== "draft") {
    throw invalidPartyState("Party can only be modified when envelope is in draft state");
  }
  
  return envelope as any; // TODO: Update when proper Envelope entity is available
};

/**
 * Validates that party sequences are sequential without gaps.
 * 
 * @param sequences - Array of sequence numbers to validate
 * @throws {BadRequestError} When sequences are not sequential
 */
export const assertSequentialSequences = (sequences: number[]): void => {
  if (!validateSequentialSequences(sequences)) {
    throw badRequest("Party sequences must be sequential without gaps (1, 2, 3, ...)");
  }
};

/**
 * Validates that a party role is valid for the given context.
 * 
 * @param role - The party role to validate
 * @throws {BadRequestError} When role is invalid
 */
export const assertValidPartyRole = (role: string): void => {
  if (!PARTY_ROLES.includes(role as any)) {
    throw badRequest(`Invalid party role: ${role}. Must be one of: ${PARTY_ROLES.join(", ")}`);
  }
};

/**
 * Validates that a party status is valid.
 * 
 * @param status - The party status to validate
 * @throws {BadRequestError} When status is invalid
 */
export const assertValidPartyStatus = (status: string): void => {
  if (!PARTY_STATUSES.includes(status as any)) {
    throw badRequest(`Invalid party status: ${status}. Must be one of: ${PARTY_STATUSES.join(", ")}`);
  }
};

/**
 * Gets the next available sequence number for a party in an envelope.
 * 
 * @param envelopeId - The envelope ID
 * @param partyRepo - The party repository
 * @returns Next available sequence number
 */
export const getNextPartySequence = async (
  envelopeId: EnvelopeId,
  partyRepo: PartiesPort
): Promise<number> => {
  // TODO: Implement when proper Party repository is available
  return 1;
};

/**
 * Validates that email is unique within an envelope.
 * 
 * @param email - The email to validate
 * @param envelopeId - The envelope ID
 * @param partyRepo - The party repository
 * @param excludePartyId - Optional party ID to exclude from uniqueness check (for updates)
 * @throws {BadRequestError} When email already exists for another party in the envelope
 */
export const assertUniqueEmailInEnvelope = async (
  email: string,
  envelopeId: EnvelopeId,
  partyRepo: PartiesPort,
  excludePartyId?: PartyId
): Promise<void> => {
  // TODO: Implement when proper Party repository is available
};
