/**
 * @file SigningValidationHelpers.ts
 * @summary Helper functions for signing validation
 * @description Provides reusable validation patterns for signing operations
 */

import { IpAddressSchema } from "@/domain/value-objects/ids";
import { envelopeNotFound, partyNotFound } from "../../../shared/errors";

/**
 * Validates actor IP address if provided
 */
export function validateActorIp(actor: any): void {
  if (actor?.ip) {
    IpAddressSchema.parse(actor.ip);
  }
}

/**
 * Validates envelope exists and returns it
 */
export async function validateEnvelope(envelopesRepo: any, envelopeId: string) {
  const envelope = await envelopesRepo.getById(envelopeId);
  if (!envelope) {
    throw envelopeNotFound({ envelopeId });
  }
  return envelope;
}

/**
 * Validates party exists and returns it
 */
export async function validateParty(partiesRepo: any, envelopeId: string, partyId: string) {
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
 */
export async function validateSigningOperation(
  command: any,
  envelopesRepo: any,
  partiesRepo: any,
  signerId?: string
) {
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
