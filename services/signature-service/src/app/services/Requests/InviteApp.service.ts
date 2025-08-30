/**
 * @file InviteApp.service.ts
 * @summary Application service for inviting parties to sign envelopes.
 * @description Orchestrates party invitation operations, delegates to RequestsCommandsPort,
 * and handles validation logic. Uses branded types for type safety.
 */

import type { EnvelopeId, PartyId } from "@/app/ports/shared";
import type { RequestsCommandsPort } from "@/app/ports/requests/RequestsCommandsPort";
import { ActorContext } from "@/app/ports/shared";

/**
 * @description Input parameters for inviting parties to an envelope.
 */
export interface InviteAppInput {
  /** The envelope ID to invite parties to */
  envelopeId: EnvelopeId;
  /** Array of party IDs to invite */
  partyIds: PartyId[];
  /** Optional actor context for audit purposes */
  actor?: ActorContext;
}

/**
 * @description Output result for party invitation.
 */
export interface InviteAppResult {
  /** Array of party IDs that were successfully invited */
  invited: PartyId[];
  /** Array of party IDs that were already pending */
  alreadyPending: PartyId[];
  /** Array of party IDs that were skipped due to rate limiting or other reasons */
  skipped: PartyId[];
  /** Whether the envelope status was changed to 'sent' */
  statusChanged: boolean;
}

/**
 * @description Dependencies required by the InviteApp service.
 */
export interface InviteAppDependencies {
  /** Requests commands port for invitation operations */
  requestsCommands: RequestsCommandsPort;
}

/**
 * @description Invites parties to sign an envelope with proper validation and event emission.
 * 
 * @param {InviteAppInput} input - The input parameters containing invitation data
 * @param {InviteAppDependencies} deps - The dependencies containing the requests commands port
 * @returns {Promise<InviteAppResult>} Promise resolving to invitation result
 * @throws {AppError} When validation fails or invitation fails
 */
export const invitePartiesApp = async (
  input: InviteAppInput,
  deps: InviteAppDependencies
): Promise<InviteAppResult> => {
  const result = await deps.requestsCommands.inviteParties({
    envelopeId: input.envelopeId,
    partyIds: input.partyIds,
    actor: input.actor,
  });

  return {
    invited: result.invited,
    alreadyPending: result.alreadyPending,
    skipped: result.skipped,
    statusChanged: result.statusChanged,
  };
};
