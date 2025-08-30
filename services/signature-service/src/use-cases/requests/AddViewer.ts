/**
 * @file AddViewer.ts
 * @description Use case to add a viewer to an envelope.
 * Handles viewer addition with validation, party creation, and domain event emission.
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
import { EnvelopeLifecycle } from "@/domain/rules";
import { ActorContext } from "@/app/ports/shared";

/**
 * @description Input contract for AddViewer use case.
 */
export interface AddViewerInput {
  /** The envelope ID to add the viewer to */
  envelopeId: EnvelopeId;
  /** Email address of the viewer */
  email: string;
  /** Optional name of the viewer */
  name?: string;
  /** Optional locale preference for the viewer */
  locale?: string;
  /** Optional actor context for audit purposes */
  actor?: ActorContext;
}

/**
 * @description Output contract for AddViewer use case.
 */
export interface AddViewerOutput {
  /** The party that was created for the viewer */
  party: Party;
  /** Domain events emitted by this use case */
  events: ReadonlyArray<DomainEvent>;
}

/**
 * @description Execution context for AddViewer use case.
 */
export interface AddViewerContext {
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
 * @description Adds a viewer to an envelope with proper validation and party creation.
 * 
 * @param {AddViewerInput} input - Input parameters for adding a viewer
 * @param {AddViewerContext} ctx - Execution context with repositories and utilities
 * @returns {Promise<AddViewerOutput>} Promise resolving to add viewer result and domain events
 * @throws {AppError} When validation fails or viewer addition fails
 */
export const addViewer = async (
  input: AddViewerInput,
  ctx: AddViewerContext
): Promise<AddViewerOutput> => {
  // Get envelope and validate it exists
  const envelope = await ctx.repos.envelopes.getById(input.envelopeId);
  if (!envelope) {
    throw new AppError(ErrorCodes.COMMON_NOT_FOUND, 404, `Envelope not found: ${input.envelopeId}`);
  }

  // Validate envelope status allows adding viewers
  EnvelopeLifecycle.assertDraft(envelope);

  // Check if viewer with this email already exists in the envelope
  const existingParties = await Promise.all(
    envelope.parties.map(partyId => ctx.repos.parties.getById(partyId as PartyId))
  );
  const validParties = existingParties.filter(Boolean) as Party[];
  
  const existingViewer = validParties.find(party => 
    party.email === input.email && party.role === "viewer"
  );

  if (existingViewer) {
    throw new AppError(ErrorCodes.COMMON_BAD_REQUEST, 409, `Viewer with email ${input.email} already exists in this envelope`);
  }

  const now = nowIso() as ISODateString;
  const events: DomainEvent[] = [];

  // Create new party for the viewer
  const partyId = ctx.ids.ulid() as PartyId;
  const newParty: Party = {
    tenantId: "default", // This should come from context
    partyId,
    envelopeId: input.envelopeId,
    email: input.email,
    name: input.name || "",
    role: "viewer",
    status: "pending",
    invitedAt: now,
    sequence: 0,
    auth: { methods: [] },
    locale: input.locale || "en",
    createdAt: now,
    updatedAt: now,
  };

  await ctx.repos.parties.create(newParty);

  // Update envelope to include the new party
  const updatedEnvelope: Envelope = {
    ...envelope,
    parties: [...envelope.parties, partyId],
    updatedAt: now,
  };

  await ctx.repos.envelopes.update(input.envelopeId, updatedEnvelope);

  // Emit party.viewer_added event
  const partyEvent: DomainEvent = {
    id: ctx.ids.ulid(),
    type: "party.viewer_added",
    occurredAt: now,
    payload: {
      envelopeId: input.envelopeId,
      partyId,
      email: input.email,
      name: input.name,
      locale: input.locale,
      actor: input.actor,
    },
    metadata: undefined,
  };
  events.push(partyEvent);

  // Log audit event
  await ctx.audit.log("envelope.add_viewer", {
    envelopeId: input.envelopeId,
    partyId,
    email: input.email,
    name: input.name,
    locale: input.locale,
    actor: input.actor,
  });

  // Publish events
  for (const event of events) {
    await ctx.events.publish(event);
  }

  return {
    party: newParty,
    events: events,
  };
};
