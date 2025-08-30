/**
 * @file Cancel.ts
 * @description Use case to cancel an envelope.
 * Handles envelope cancellation with validation, lifecycle transitions, and domain event emission.
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

import { ActorContext } from "@/app/ports/shared";

/**
 * @description Input contract for Cancel use case.
 */
export interface CancelInput {
  /** The envelope ID to cancel */
  envelopeId: EnvelopeId;
  /** Optional reason for cancellation */
  reason?: string;
  /** Optional actor context for audit purposes */
  actor?: ActorContext;
}

/**
 * @description Output contract for Cancel use case.
 */
export interface CancelOutput {
  /** The envelope that was canceled */
  envelope: Envelope;
  /** Domain events emitted by this use case */
  events: ReadonlyArray<DomainEvent>;
}

/**
 * @description Execution context for Cancel use case.
 */
export interface CancelContext {
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
 * @description Cancels an envelope with proper validation and lifecycle management.
 * 
 * @param {CancelInput} input - Input parameters for envelope cancellation
 * @param {CancelContext} ctx - Execution context with repositories and utilities
 * @returns {Promise<CancelOutput>} Promise resolving to cancellation result and domain events
 * @throws {AppError} When validation fails or cancellation fails
 */
export const cancelEnvelope = async (
  input: CancelInput,
  ctx: CancelContext
): Promise<CancelOutput> => {
  // Get envelope and validate it exists
  const envelope = await ctx.repos.envelopes.getById(input.envelopeId);
  if (!envelope) {
    throw new AppError(ErrorCodes.COMMON_NOT_FOUND, 404, `Envelope not found: ${input.envelopeId}`);
  }

  // Validate envelope status allows cancellation
  if (envelope.status === "completed" || envelope.status === "declined" || envelope.status === "canceled") {
    throw new AppError(ErrorCodes.COMMON_BAD_REQUEST, 409, `Envelope status '${envelope.status}' does not allow cancellation`);
  }

  // Validate lifecycle transition
  EnvelopeLifecycle.assertLifecycleTransition(envelope.status, "canceled");

  const now = nowIso() as ISODateString;
  const events: DomainEvent[] = [];

  // Update envelope status to cancelled
  const updatedEnvelope: Envelope = {
    ...envelope,
    status: "canceled",
    updatedAt: now,
  };

  await ctx.repos.envelopes.update(input.envelopeId, updatedEnvelope);

  // Emit envelope.cancelled event
  const envelopeEvent: DomainEvent = {
    id: ctx.ids.ulid(),
    type: "envelope.cancelled",
    occurredAt: now,
    payload: {
      envelopeId: input.envelopeId,
      reason: input.reason,
      actor: input.actor,
    },
    metadata: undefined,
  };
  events.push(envelopeEvent);

  // Get all parties to notify them about cancellation
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
        notificationType: "envelope_cancelled",
        reason: input.reason,
        actor: input.actor,
      },
      metadata: undefined,
    };
    events.push(partyEvent);
  }

  // Log audit event
  await ctx.audit.log("envelope.cancel", {
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
