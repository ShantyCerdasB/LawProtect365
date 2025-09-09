/**
 * @file SigningValidationHelpers.ts
 * @summary Helper functions for signing validation
 * @description Provides reusable validation patterns for signing operations
 */

import { IpAddressSchema } from "../../../domain/value-objects/ids";
import { envelopeNotFound, partyNotFound } from "../../../shared/errors";
import type { EnvelopeId, PartyId } from "../../../domain/value-objects/ids";
import type { Envelope } from "../../../domain/entities/Envelope";
import type { Party } from "../../../domain/entities/Party";

/**
 * Validates actor IP address if provided
 * @param actor - Actor object containing optional IP address
 * @throws Validation error if IP address format is invalid
 */
export function validateActorIp(actor: { ip?: string } | undefined): void {
  if (actor?.ip) {
    IpAddressSchema.parse(actor.ip);
  }
}

/**
 * Validates envelope exists and returns it
 * @param envelopesRepo - Repository for envelope operations
 * @param envelopeId - Unique identifier for the envelope
 * @returns Promise resolving to the envelope entity
 * @throws NotFoundError if envelope does not exist
 */
export async function validateEnvelope(envelopesRepo: { getById(id: EnvelopeId): Promise<Envelope | null> }, envelopeId: EnvelopeId): Promise<Envelope> {
  const envelope = await envelopesRepo.getById(envelopeId);
  if (!envelope) {
    throw envelopeNotFound({ envelopeId });
  }
  return envelope;
}

/**
 * Validates party exists and returns it
 * @param partiesRepo - Repository for party operations
 * @param envelopeId - Unique identifier for the envelope
 * @param partyId - Unique identifier for the party
 * @returns Promise resolving to the party entity
 * @throws NotFoundError if party does not exist
 */
export async function validateParty(partiesRepo: { getById(key: { envelopeId: EnvelopeId; partyId: PartyId }): Promise<Party | null> }, envelopeId: EnvelopeId, partyId: PartyId): Promise<Party> {
  const party = await partiesRepo.getById({ 
    envelopeId, 
    partyId 
  });
  if (!party) {
    throw partyNotFound({ partyId, envelopeId });
  }
  return party;
}

/**
 * Common validation for signing operations
 * @param command - Command object containing envelope ID and actor context
 * @param envelopesRepo - Repository for envelope operations
 * @param partiesRepo - Repository for party operations
 * @param signerId - Optional signer ID for party validation
 * @returns Promise resolving to validation result with envelope and optional party
 */
export async function validateSigningOperation(
  command: { envelopeId: EnvelopeId; actor?: { ip?: string } },
  envelopesRepo: { getById(id: EnvelopeId): Promise<Envelope | null> },
  partiesRepo: { getById(key: { envelopeId: EnvelopeId; partyId: PartyId }): Promise<Party | null> },
  signerId?: PartyId
): Promise<{ envelope: Envelope; party: Party | null }> {
  // Validate IP address if provided
  validateActorIp(command.actor);

  // Get and validate envelope
  const envelope = await validateEnvelope(envelopesRepo, command.envelopeId);

  // Get and validate party if signerId is provided
  let party = null;
  if (signerId) {
    party = await validateParty(partiesRepo, command.envelopeId, signerId);
  }

  return { envelope, party };
}
