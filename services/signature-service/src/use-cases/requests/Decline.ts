/**
 * @file Decline.ts
 * @description Use case to decline an envelope.
 * Handles envelope decline with validation, lifecycle transitions, and domain event emission.
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
import type { EnvelopeId } from "@/domain/value-objects/Ids";
import { EnvelopeLifecycle } from "@/domain/rules";

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
 * @description Input contract for Decline use case.
 */
export interface DeclineInput {
  /** The envelope ID to decline */
  envelopeId: EnvelopeId;
  /** Optional reason for decline */
  reason?: string;
  /** Optional actor context for audit purposes */
  actor?: ActorContext;
}

/**
 * @description Output contract for Decline use case.
 */
export interface DeclineOutput {
  /** The envelope that was declined */
  envelope: Envelope;
  /** Domain events emitted by this use case */
  events: ReadonlyArray<DomainEvent>;
}

/**
 * @description Execution context for Decline use case.
 */
export interface DeclineContext {
  /** Repository dependencies */
  repos: {
    /** Envelope repository */
    envelopes: Repository<Envelope, EnvelopeId>;
    /** Party repository */
    parties: Repository<Party, any>;
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
 * @description Declines an envelope with proper validation and lifecycle management.
 * 
 * @param {DeclineInput} input - Input parameters for envelope decline
 * @param {DeclineContext} ctx - Execution context with repositories and utilities
 * @returns {Promise<DeclineOutput>} Promise resolving to decline result and domain events
 * @throws {AppError} When validation fails or decline fails
 */
export const declineEnvelope = async (
  input: DeclineInput,
  ctx: DeclineContext
): Promise<DeclineOutput> => {
  // Get envelope and validate it exists
  const envelope = await ctx.repos.envelopes.getById(input.envelopeId);
  if (!envelope) {
    throw new AppError(ErrorCodes.COMMON_NOT_FOUND, 404, `Envelope not found: ${input.envelopeId}`);
  }

  // Validate envelope status allows decline
  if (envelope.status === "completed" || envelope.status === "declined" || envelope.status === "canceled") {
    throw new AppError(ErrorCodes.COMMON_BAD_REQUEST, 409, `Envelope status '${envelope.status}' does not allow decline`);
  }

  // Validate lifecycle transition
  EnvelopeLifecycle.assertLifecycleTransition(envelope.status, "declined");

  const now = nowIso() as ISODateString;
  const events: DomainEvent[] = [];

  // Update envelope status to declined
  const updatedEnvelope: Envelope = {
    ...envelope,
    status: "declined",
    updatedAt: now,
  };

  await ctx.repos.envelopes.update(input.envelopeId, updatedEnvelope);

  // Emit envelope.declined event
  const envelopeEvent: DomainEvent = {
    id: ctx.ids.ulid(),
    type: "envelope.declined",
    occurredAt: now,
    payload: {
      envelopeId: input.envelopeId,
      reason: input.reason,
      actor: input.actor,
    },
    metadata: undefined,
  };
  events.push(envelopeEvent);

  // Get all parties to notify them about decline
  const allParties = await Promise.all(
    envelope.parties.map(partyId => ctx.repos.parties.getById(partyId as any))
  );
  const validParties = allParties.filter(Boolean) as Party[];

  // Emit party.notified events for all parties
  for (const party of validParties) {
    const partyEvent: DomainEvent = {
      id: ctx.ids.ulid(),
      type: "party.notified",
      occurredAt: now,
      payload: {
        envelopeId: input.envelopeId,
        partyId: party.partyId,
        notificationType: "envelope_declined",
        reason: input.reason,
        actor: input.actor,
      },
      metadata: undefined,
    };
    events.push(partyEvent);
  }

  // Log audit event
  await ctx.audit.log("envelope.decline", {
    envelopeId: input.envelopeId,
    reason: input.reason,
    actor: input.actor,
  });

  // Publish events
  for (const event of events) {
    await ctx.events.publish(event);
  }

  return {
    envelope: updatedEnvelope,
    events: events,
  };
};
