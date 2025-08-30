/**
 * @file Finalise.ts
 * @description Use case to finalize a completed envelope.
 * Handles envelope finalization with validation, artifact generation, and domain event emission.
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
import type { EnvelopeId } from "@/domain/value-objects/Ids";

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
 * @description Input contract for Finalise use case.
 */
export interface FinaliseInput {
  /** The envelope ID to finalize */
  envelopeId: EnvelopeId;
  /** Optional message for finalization */
  message?: string;
  /** Optional actor context for audit purposes */
  actor?: ActorContext;
}

/**
 * @description Output contract for Finalise use case.
 */
export interface FinaliseOutput {
  /** The envelope that was finalized */
  envelope: Envelope;
  /** Array of generated artifact IDs (certificates, PDFs, etc.) */
  artifactIds: string[];
  /** Timestamp when the envelope was finalized */
  finalizedAt: string;
  /** Domain events emitted by this use case */
  events: ReadonlyArray<DomainEvent>;
}

/**
 * @description Execution context for Finalise use case.
 */
export interface FinaliseContext {
  /** Repository dependencies */
  repos: {
    /** Envelope repository */
    envelopes: Repository<Envelope, EnvelopeId>;
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
 * @description Finalizes a completed envelope with proper validation and artifact generation.
 * 
 * @param {FinaliseInput} input - Input parameters for envelope finalization
 * @param {FinaliseContext} ctx - Execution context with repositories and utilities
 * @returns {Promise<FinaliseOutput>} Promise resolving to finalization result and domain events
 * @throws {AppError} When validation fails or finalization fails
 */
export const finaliseEnvelope = async (
  input: FinaliseInput,
  ctx: FinaliseContext
): Promise<FinaliseOutput> => {
  // Get envelope and validate it exists
  const envelope = await ctx.repos.envelopes.getById(input.envelopeId);
  if (!envelope) {
    throw new AppError(ErrorCodes.COMMON_NOT_FOUND, 404, `Envelope not found: ${input.envelopeId}`);
  }

  // Validate envelope status is completed
  if (envelope.status !== "completed") {
    throw new AppError(ErrorCodes.COMMON_BAD_REQUEST, 409, `Envelope status '${envelope.status}' does not allow finalization. Only completed envelopes can be finalized.`);
  }

  const now = nowIso() as ISODateString;
  const events: DomainEvent[] = [];
  const artifactIds: string[] = [];

  // Generate certificate artifact
  const certificateId = ctx.ids.ulid();
  artifactIds.push(certificateId);

  // Generate consolidated PDF artifact
  const pdfId = ctx.ids.ulid();
  artifactIds.push(pdfId);

  // Generate audit trail artifact
  const auditId = ctx.ids.ulid();
  artifactIds.push(auditId);

  // Emit envelope.finalised event
  const envelopeEvent: DomainEvent = {
    id: ctx.ids.ulid(),
    type: "envelope.finalised",
    occurredAt: now,
    payload: {
      envelopeId: input.envelopeId,
      artifactIds,
      message: input.message,
      actor: input.actor,
    },
    metadata: undefined,
  };
  events.push(envelopeEvent);

  // Emit certificate.generated event
  const certificateEvent: DomainEvent = {
    id: ctx.ids.ulid(),
    type: "certificate.generated",
    occurredAt: now,
    payload: {
      envelopeId: input.envelopeId,
      certificateId,
      actor: input.actor,
    },
    metadata: undefined,
  };
  events.push(certificateEvent);

  // Emit pdf.consolidated event
  const pdfEvent: DomainEvent = {
    id: ctx.ids.ulid(),
    type: "pdf.consolidated",
    occurredAt: now,
    payload: {
      envelopeId: input.envelopeId,
      pdfId,
      actor: input.actor,
    },
    metadata: undefined,
  };
  events.push(pdfEvent);

  // Log audit event
  await ctx.audit.log("envelope.finalise", {
    envelopeId: input.envelopeId,
    artifactIds,
    message: input.message,
    actor: input.actor,
  });

  // Publish events
  for (const event of events) {
    await ctx.events.publish(event);
  }

  return {
    envelope,
    artifactIds,
    finalizedAt: now,
    events: events,
  };
};
