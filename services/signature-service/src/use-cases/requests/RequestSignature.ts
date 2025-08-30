/**
 * @file RequestSignature.ts
 * @description Use case to request a signature from a specific party.
 * Handles signature request with validation, token generation, and domain event emission.
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
import { EnvelopeLifecycle, Flow } from "@/domain/rules";
import { ActorContext } from "@/app/ports/shared";


/**
 * @description Input contract for RequestSignature use case.
 */
export interface RequestSignatureInput {
  /** The envelope ID to request signature for */
  envelopeId: EnvelopeId;
  /** The party ID to request signature from */
  partyId: PartyId;
  /** Optional custom message for the signature request */
  message?: string;
  /** Optional channel for sending the request (email, sms) */
  channel?: "email" | "sms";
  /** Optional actor context for audit purposes */
  actor?: ActorContext;
}

/**
 * @description Output contract for RequestSignature use case.
 */
export interface RequestSignatureOutput {
  /** The party ID that was requested to sign */
  partyId: PartyId;
  /** The signing URL generated for the party */
  signingUrl: string;
  /** When the signing URL expires */
  expiresAt: string;
  /** Whether the envelope status was changed to 'sent' */
  statusChanged: boolean;
  /** Domain events emitted by this use case */
  events: ReadonlyArray<DomainEvent>;
}

/**
 * @description Execution context for RequestSignature use case.
 */
export interface RequestSignatureContext {
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
 * @description Requests a signature from a specific party with proper validation and token generation.
 * 
 * @param {RequestSignatureInput} input - Input parameters for signature request
 * @param {RequestSignatureContext} ctx - Execution context with repositories and utilities
 * @returns {Promise<RequestSignatureOutput>} Promise resolving to signature request result and domain events
 * @throws {AppError} When validation fails or signature request fails
 */
export const requestSignature = async (
  input: RequestSignatureInput,
  ctx: RequestSignatureContext
): Promise<RequestSignatureOutput> => {
  // Get envelope and validate it exists
  const envelope = await ctx.repos.envelopes.getById(input.envelopeId);
  if (!envelope) {
    throw new AppError(ErrorCodes.COMMON_NOT_FOUND, 404, `Envelope not found: ${input.envelopeId}`);
  }

  // Get party and validate it exists and belongs to the envelope
  const party = await ctx.repos.parties.getById(input.partyId);
  if (!party) {
    throw new AppError(ErrorCodes.COMMON_NOT_FOUND, 404, `Party not found: ${input.partyId}`);
  }

  // Validate party belongs to the envelope
  if (!envelope.parties.includes(input.partyId)) {
    throw new AppError(ErrorCodes.COMMON_BAD_REQUEST, 400, `Party ${input.partyId} does not belong to envelope ${input.envelopeId}`);
  }

  // Validate party is a signer
  if (party.role !== "signer") {
    throw new AppError(ErrorCodes.COMMON_BAD_REQUEST, 400, `Party ${input.partyId} is not a signer`);
  }

  // Check if this is the first signature request (envelope status is 'draft')
  const isFirstRequest = envelope.status === "draft";
  let statusChanged = false;

  // If this is the first request, transition to 'sent'
  if (isFirstRequest) {
    EnvelopeLifecycle.assertLifecycleTransition(envelope.status, "sent");
    statusChanged = true;
  }

  // Apply rate limiting policy
  try {
          const stats = {
        lastSentAt: party.invitedAt ? new Date(party.invitedAt).getTime() : undefined,
        sentToday: party.invitedAt && new Date(party.invitedAt).toDateString() === new Date().toDateString() ? 1 : 0,
      minCooldownMs: 5 * 60 * 1000, // 5 minutes
      dailyLimit: 10, // 10 requests per day
    };
          Flow.assertInvitePolicy(stats);
  } catch (error) {
    throw new AppError(ErrorCodes.COMMON_TOO_MANY_REQUESTS, 429, "Rate limit exceeded for signature request");
  }

  const now = nowIso() as ISODateString;
  const events: DomainEvent[] = [];

  // Generate signing token and URL
  const token = ctx.ids.ulid();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days
  const signingUrl = `${process.env.SIGNING_BASE_URL || 'https://sign.lawprotect.com'}/sign/${token}`;

  // Update party with last invited timestamp
  const updatedParty: Party = {
    ...party,
    invitedAt: now,
    updatedAt: now,
  };

  await ctx.repos.parties.update(input.partyId, updatedParty);

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
        partyIds: [input.partyId],
        actor: input.actor,
      },
      metadata: undefined,
    };
    events.push(envelopeEvent);
  }

  // Emit party.request_signature event
  const partyEvent: DomainEvent = {
    id: ctx.ids.ulid(),
    type: "party.request_signature",
    occurredAt: now,
    payload: {
      envelopeId: input.envelopeId,
      partyId: input.partyId,
      signingUrl,
      expiresAt,
      message: input.message,
      channel: input.channel,
      actor: input.actor,
    },
    metadata: undefined,
  };
  events.push(partyEvent);

  // Log audit event
  await ctx.audit.log("envelope.request_signature", {
    envelopeId: input.envelopeId,
    partyId: input.partyId,
    signingUrl,
    expiresAt,
    message: input.message,
    channel: input.channel,
    statusChanged,
    actor: input.actor,
  });

  // Publish events
  for (const event of events) {
    await ctx.events.publish(event);
  }

  return {
    partyId: input.partyId,
    signingUrl,
    expiresAt,
    statusChanged,
    events: events,
  };
};
