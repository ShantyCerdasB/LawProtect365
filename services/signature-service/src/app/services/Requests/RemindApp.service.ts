/**
 * @file RemindApp.service.ts
 * @summary Application service for sending reminders to parties.
 * @description Orchestrates reminder operations, delegates to RequestsCommandsPort,
 * and handles validation logic. Uses branded types for type safety.
 */

import type { EnvelopeId, PartyId } from "@/app/ports/shared";
import type { RequestsCommandsPort } from "@/app/ports/requests/RequestsCommandsPort";

/**
 * @description Actor context for audit and attribution purposes.
 */
export interface ActorContext {
  /** User identifier */
  userId?: string;
  /** User email address */
  email?: string;
  /** Client IP address */
  ip?: string;
  /** User agent string */
  userAgent?: string;
  /** User locale preference */
  locale?: string;
}

/**
 * @description Input parameters for sending reminders to parties.
 */
export interface RemindAppInput {
  /** The envelope ID to send reminders for */
  envelopeId: EnvelopeId;
  /** Optional array of specific party IDs to remind */
  partyIds?: PartyId[];
  /** Optional custom message for the reminder */
  message?: string;
  /** Optional actor context for audit purposes */
  actor?: ActorContext;
}

/**
 * @description Output result for sending reminders.
 */
export interface RemindAppResult {
  /** Array of party IDs that were successfully reminded */
  reminded: PartyId[];
  /** Array of party IDs that were skipped */
  skipped: PartyId[];
}

/**
 * @description Dependencies required by the RemindApp service.
 */
export interface RemindAppDependencies {
  /** Requests commands port for reminder operations */
  requestsCommands: RequestsCommandsPort;
}

/**
 * @description Sends reminders to parties for an envelope with proper validation and event emission.
 * 
 * @param {RemindAppInput} input - The input parameters containing reminder data
 * @param {RemindAppDependencies} deps - The dependencies containing the requests commands port
 * @returns {Promise<RemindAppResult>} Promise resolving to reminder result
 * @throws {AppError} When validation fails or reminder fails
 */
export const remindPartiesApp = async (
  input: RemindAppInput,
  deps: RemindAppDependencies
): Promise<RemindAppResult> => {
  const result = await deps.requestsCommands.remindParties({
    envelopeId: input.envelopeId,
    partyIds: input.partyIds,
    message: input.message,
    actor: input.actor,
  });

  return {
    reminded: result.reminded,
    skipped: result.skipped,
  };
};
