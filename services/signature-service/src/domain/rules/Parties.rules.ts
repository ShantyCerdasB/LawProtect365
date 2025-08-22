// src/domain/validators/party.ts

import type { Party } from "@/domain/entities";
import { PartyRoleSchema, SequenceNumberSchema } from "../value-objects/Party";
import { badRequest } from "@/errors";

/**
 * Ensures at least one signer exists within the party list.
 *
 * @param parties - Parties associated with the envelope.
 * @throws {BadRequestError} When no signer is present.
 */
export const assertAtLeastOneSigner = (parties: readonly Party[]): void => {
  const hasSigner = parties.some((p) => PartyRoleSchema.parse(p.role) === "signer");
  if (!hasSigner) {
    throw badRequest("At least one signer is required");
  }
};

/**
 * Validates strict, gapless signing sequence when sequential flow is enabled.
 * Expects 1..N with no duplicates and no gaps, excluding viewers.
 *
 * @param parties - Parties associated with the envelope.
 * @param sequential - Whether sequential signing is enforced.
 * @throws {BadRequestError} When the sequence is not contiguous starting at 1.
 */
export const assertStrictSequence = (parties: readonly Party[], sequential = true): void => {
  if (!sequential) return;

  const seqs = parties
    .filter((p) => PartyRoleSchema.parse(p.role) !== "viewer")
    .map((p) => SequenceNumberSchema.parse(p.sequence));

  if (seqs.length === 0) return;

  const sorted = [...seqs].sort((a, b) => a - b);
  for (let i = 0; i < sorted.length; i++) {
    const expected = i + 1;
    if (sorted[i] !== expected) {
      throw badRequest("Invalid signing sequence (must be 1..N without gaps)");
    }
  }
};

/**
 * Ensures a delegation preserves role and sequence for auditability.
 *
 * @param original - The original party role and sequence.
 * @param delegated - The delegated party role and sequence.
 * @throws {BadRequestError} When delegation changes signing order or role.
 */
export const assertDelegationSafe = (
  original: Pick<Party, "role" | "sequence">,
  delegated: Pick<Party, "role" | "sequence">
): void => {
  if (original.sequence !== delegated.sequence) {
    throw badRequest("Delegation cannot change signing order");
  }
  if (original.role !== delegated.role) {
    throw badRequest("Delegation cannot change party role");
  }
};
