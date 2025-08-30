/**
 * @file Invite.ts
 * @description Use case to invite parties to sign an envelope.
 * Handles party invitation with validation, lifecycle transitions, and domain event emission.
 */

import {
  z,
  nowIso,
  AppError,
  ErrorCodes,
  type DomainEvent,
  type ISODateString,
} from "@lawprotect/shared-ts";
import type { Repository } from "@lawprotect/shared-ts";

import type { Envelope } from "@/domain/entities/Envelope";
import type { Party } from "@/domain/entities/Party";
import type { Input } from "@/domain/entities/Input";
import type { EnvelopeId, PartyId } from "@/domain/value-objects/Ids";
import { EnvelopeLifecycle, Flow } from "@/domain/rules";
import { ActorContext } from "@/app/ports/shared";


/**
 * @description Input contract for Invite use case.
 */
export interface InviteInput {
  /** The envelope ID to invite parties to */
  envelopeId: EnvelopeId;
  /** Array of party IDs to invite */
  partyIds: PartyId[];
  /** Optional actor context for audit purposes */
  actor?: ActorContext;
}

/**
 * @description Output contract for Invite use case.
 */
export interface InviteOutput {
  /** Array of party IDs that were successfully invited */
  invited: PartyId[];
  /** Array of party IDs that were already pending */
  alreadyPending: PartyId[];
  /** Array of party IDs that were skipped due to rate limiting or other reasons */
  skipped: PartyId[];
  /** Whether the envelope status was changed to 'sent' */
  statusChanged: boolean;
  /** Domain events emitted by this use case */
  events: ReadonlyArray<DomainEvent>;
}

/**
 * @description Execution context for Invite use case.
 */
export interface InviteContext {
  /** Repository dependencies */
  repos: {
    /** Envelope repository */
    envelopes: Repository<Envelope, EnvelopeId>;
    /** Party repository */
    parties: Repository<Party, PartyId>;
    /** Input repository */
    inputs: Repository<Input, any>;
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
 * @description Invites parties to sign an envelope with proper validation and lifecycle management.
 * 
 * @param {InviteInput} input - Input parameters for party invitation
 * @param {InviteContext} ctx - Execution context with repositories and utilities
 * @returns {Promise<InviteOutput>} Promise resolving to invitation result and domain events
 * @throws {AppError} When validation fails or invitation fails
 */
export const inviteParties = async (
  input: InviteInput,
  ctx: InviteContext
): Promise<InviteOutput> => {
  // Validate input
  if (!input.partyIds || input.partyIds.length === 0) {
    throw new AppError(ErrorCodes.COMMON_BAD_REQUEST, 400, "At least one party ID is required");
  }

  // Get envelope and validate it exists
  const envelope = await ctx.repos.envelopes.getById(input.envelopeId);
  if (!envelope) {
    throw new AppError(ErrorCodes.COMMON_NOT_FOUND, 404, `Envelope not found: ${input.envelopeId}`);
  }

  // Get all parties for the envelope
  const allParties = await Promise.all(
    envelope.parties.map(partyId => ctx.repos.parties.getById(partyId as PartyId))
  );
  const validParties = allParties.filter(Boolean) as Party[];

  // Get all inputs for the envelope
  const allInputs = await Promise.all(
    envelope.documents.map(docId => ctx.repos.inputs.getById(docId))
  );
  const validInputs = allInputs.filter(Boolean) as Input[];

  // Validate readiness to send
  Flow.assertReadyToSend(validParties, validInputs);

  // Check if this is the first invitation (envelope status is 'draft')
  const isFirstInvitation = envelope.status === "draft";
  let statusChanged = false;

  // If this is the first invitation, transition to 'sent'
  if (isFirstInvitation) {
    EnvelopeLifecycle.assertLifecycleTransition(envelope.status, "sent");
    statusChanged = true;
  }

  const invited: PartyId[] = [];
  const alreadyPending: PartyId[] = [];
  const skipped: PartyId[] = [];
  const events: DomainEvent[] = [];

  const now = nowIso() as ISODateString;

  // Process each party
  for (const partyId of input.partyIds) {
    const party = validParties.find(p => p.partyId === partyId);
    if (!party) {
      skipped.push(partyId);
      continue;
    }

    // Check if party is already invited
    if (party.status === "invited" || party.status === "pending") {
      alreadyPending.push(partyId);
      continue;
    }

    // Apply rate limiting policy
    try {
      const stats = {
        lastSentAt: party.invitedAt ? new Date(party.invitedAt).getTime() : undefined,
        sentToday: party.invitedAt && new Date(party.invitedAt).toDateString() === new Date().toDateString() ? 1 : 0,
        minCooldownMs: 5 * 60 * 1000, // 5 minutes
        dailyLimit: 10, // 10 invitations per day
      };
      Flow.assertInvitePolicy(stats);
    } catch (error) {
      skipped.push(partyId);
      continue;
    }

    // Update party status to invited
    const updatedParty: Party = {
      ...party,
      status: "invited",
      invitedAt: now,
      updatedAt: now,
    };

    await ctx.repos.parties.update(partyId, updatedParty);
    invited.push(partyId);

    // Emit party.invited event
    const partyEvent: DomainEvent = {
      id: ctx.ids.ulid(),
      type: "party.invited",
      occurredAt: now,
      payload: {
        envelopeId: input.envelopeId,
        partyId,
        actor: input.actor,
      },
      metadata: undefined,
    };
    events.push(partyEvent);
  }

  // If status changed, update envelope
  if (statusChanged) {
    const updatedEnvelope: Envelope = {
      ...envelope,
      status: "sent",
      updatedAt: now,
    };
    await ctx.repos.envelopes.update(input.envelopeId, updatedEnvelope);

    // Emit envelope.invited event
    const envelopeEvent: DomainEvent = {
      id: ctx.ids.ulid(),
      type: "envelope.invited",
      occurredAt: now,
      payload: {
        envelopeId: input.envelopeId,
        partyIds: invited,
        actor: input.actor,
      },
      metadata: undefined,
    };
    events.push(envelopeEvent);
  }

  // Log audit event
  await ctx.audit.log("envelope.invite", {
    envelopeId: input.envelopeId,
    partyIds: input.partyIds,
    invited,
    alreadyPending,
    skipped,
    statusChanged,
    actor: input.actor,
  });

  // Publish events
  for (const event of events) {
    await ctx.events.publish(event);
  }

  return {
    invited,
    alreadyPending,
    skipped,
    statusChanged,
    events: events,
  };
};
