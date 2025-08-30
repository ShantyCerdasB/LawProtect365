/**
 * @file Remind.ts
 * @description Use case to send reminders to parties for an envelope.
 * Handles reminder sending with validation, rate limiting, and domain event emission.
 */

import {
  nowIso,
  AppError,
  ErrorCodes,
  type DomainEvent,
  type ISODateString,
} from "@lawprotect/shared-ts";
import type { Repository } from "@lawprotect/shared-ts";

import type { Envelope } from "@/domain/entities/Envelope";
import type { Party } from "@/domain/entities/Party";
import type { EnvelopeId, PartyId } from "@/domain/value-objects/Ids";
import { Flow } from "@/domain/rules";
import type { ActorContext } from "@/app/ports/shared";

/**
 * @description Input contract for Remind use case.
 */
export interface RemindInput {
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
 * @description Output contract for Remind use case.
 */
export interface RemindOutput {
  /** Array of party IDs that were successfully reminded */
  reminded: PartyId[];
  /** Array of party IDs that were skipped */
  skipped: PartyId[];
  /** Domain events emitted by this use case */
  events: ReadonlyArray<DomainEvent>;
}

/**
 * @description Execution context for Remind use case.
 */
export interface RemindContext {
  /** Repository dependencies */
  repos: {
    /** Envelope repository */
    envelopes: Repository<Envelope, EnvelopeId>;
    /** Party repository */
    parties: Repository<Party, PartyId>;
  };
  /** ID generation utilities */
  ids: {
    /** Monotonic or time-ordered id generator (e.g., ULID) */
    ulid(): string;
  };
  /** Event publisher for domain events */
  events: {
    /** Publish domain events */
    publish(event: any): Promise<void>;
  };
  /** Audit service for logging actions */
  audit: {
    /** Log audit event */
    log(action: string, details: any): Promise<void>;
  };
}

/**
 * @description Sends reminders to parties for an envelope with proper validation and rate limiting.
 * 
 * @param {RemindInput} input - Input parameters for sending reminders
 * @param {RemindContext} ctx - Execution context with repositories and utilities
 * @returns {Promise<RemindOutput>} Promise resolving to reminder result and domain events
 * @throws {AppError} When validation fails or reminder fails
 */
export const remindParties = async (
  input: RemindInput,
  ctx: RemindContext
): Promise<RemindOutput> => {
  // Get envelope and validate it exists
  const envelope = await ctx.repos.envelopes.getById(input.envelopeId);
  if (!envelope) {
    throw new AppError(ErrorCodes.COMMON_NOT_FOUND, 404, `Envelope not found: ${input.envelopeId}`);
  }

  // Validate envelope status allows reminders
  if (envelope.status !== "sent" && envelope.status !== "in_progress") {
    throw new AppError(ErrorCodes.COMMON_BAD_REQUEST, 409, `Envelope status '${envelope.status}' does not allow reminders`);
  }

  // Get all parties for the envelope
  const allParties = await Promise.all(
    envelope.parties.map(partyId => ctx.repos.parties.getById(partyId as PartyId))
  );
  const validParties = allParties.filter(Boolean) as Party[];

  // Determine which parties to remind
  let partiesToRemind: Party[];
  if (input.partyIds && input.partyIds.length > 0) {
    // Remind specific parties
    partiesToRemind = validParties.filter(party => 
      input.partyIds!.includes(party.partyId as string)
    );
  } else {
    // Remind all pending parties
    partiesToRemind = validParties.filter(party => 
      party.status === "invited" || party.status === "pending"
    );
  }

  if (partiesToRemind.length === 0) {
    throw new AppError(ErrorCodes.COMMON_BAD_REQUEST, 400, "No parties available for reminder");
  }

  const reminded: PartyId[] = [];
  const skipped: PartyId[] = [];
  const events: DomainEvent[] = [];

  const now = nowIso() as ISODateString;

  // Process each party
  for (const party of partiesToRemind) {
    // Apply rate limiting policy for reminders
    try {
      const stats = {
        lastSentAt: party.invitedAt ? new Date(party.invitedAt).getTime() : undefined,
        sentToday: party.invitedAt && new Date(party.invitedAt).toDateString() === new Date().toDateString() ? 1 : 0,
        minCooldownMs: 10 * 60 * 1000, // 10 minutes for reminders
        dailyLimit: 5, // 5 reminders per day
      };
      Flow.assertInvitePolicy(stats);
    } catch (error) {
      skipped.push(party.partyId as PartyId);
      continue;
    }

    // Update party with reminder timestamp
    const updatedParty: Party = {
      ...party,
      invitedAt: now,
      updatedAt: now,
    };

    await ctx.repos.parties.update(party.partyId as PartyId, updatedParty);
    reminded.push(party.partyId as PartyId);

    // Emit party.reminded event
    const partyEvent: DomainEvent = {
      id: ctx.ids.ulid(),
      type: "party.reminded",
      occurredAt: now,
      payload: {
        envelopeId: input.envelopeId,
        partyId: party.partyId,
        message: input.message,
        actor: input.actor,
      },
      metadata: undefined,
    };
    events.push(partyEvent);
  }

  // Log audit event
  await ctx.audit.log("envelope.remind", {
    envelopeId: input.envelopeId,
    partyIds: partiesToRemind.map(p => p.partyId),
    reminded,
    skipped,
    message: input.message,
    actor: input.actor,
  });

  // Publish events
  for (const event of events) {
    await ctx.events.publish(event);
  }

  return {
    reminded,
    skipped,
    events: events,
  };
};
