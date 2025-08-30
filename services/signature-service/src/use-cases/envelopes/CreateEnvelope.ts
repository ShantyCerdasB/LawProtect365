/**
 * @file CreateEnvelope.ts
 * @description Use case to create a new envelope (draft) and emit a domain event.
 * Handles envelope creation with validation, persistence, and domain event emission for audit tracking.
 */

/**
 * @file CreateEnvelope.ts
 * @summary Use case to create a new envelope (draft) and emit a domain event.
 *
 * @description
 * Responsibilities:
 * - Validate and normalize input (trimmed/bounded title; required owner).
 * - Build and persist the `Envelope` aggregate via the repository port.
 * - Emit a domain event (`envelope.created`) for upstream subscribers (e.g., audit).
 * - Keep orchestration-only; no transport or provider concerns.
 */

import {
  z,
  TrimmedString,
  nowIso,
  AppError,
  ErrorCodes,
  type DomainEvent,
  type ISODateString,
} from "@lawprotect/shared-ts";
import type { Repository } from "@lawprotect/shared-ts";

import type { Envelope } from "@/domain/entities/Envelope";
import type { EnvelopeId, TenantId, UserId } from "@/domain/value-objects/Ids";
import { ActorContext } from "@/app/ports/shared";

/**
 * @description Input contract for CreateEnvelope use case.
 * Defines the required parameters for creating a new envelope.
 */
export interface CreateEnvelopeInput {
  /** Tenant identifier */
  tenantId: TenantId;
  /** Owner identifier */
  ownerId: UserId;
  /** Envelope title */
  title: string;
  /** Optional actor context for downstream subscribers */
  actor?: ActorContext;
}

/**
 * @description Output contract for CreateEnvelope use case.
 * Contains the created envelope and emitted domain events.
 */
export interface CreateEnvelopeOutput {
  /** Created envelope entity */
  envelope: Envelope;
  /** Domain events emitted by this use case */
  events: ReadonlyArray<DomainEvent>;
}

/**
 * @description Execution context for CreateEnvelope use case.
 * Provides repository access and ID generation capabilities.
 */
export interface CreateEnvelopeContext {
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
}

/**
 * @description Creates a new envelope with status "draft" and emits `envelope.created` domain event.
 * Validates input, creates envelope entity, persists to repository, and emits audit event.
 *
 * @param {CreateEnvelopeInput} input - Input parameters for envelope creation
 * @param {CreateEnvelopeContext} ctx - Execution context with repositories and utilities
 * @returns {Promise<CreateEnvelopeOutput>} Promise resolving to created envelope and domain events
 * @throws {AppError} 400 when invariants are violated
 */
export const createEnvelope = async (
  input: CreateEnvelopeInput,
  ctx: CreateEnvelopeContext
): Promise<CreateEnvelopeOutput> => {
  // Title: trim → validate length
  const title = TrimmedString.pipe(z.string().min(1).max(255)).parse(input.title);

  if (!input.ownerId) {
    throw new AppError(ErrorCodes.COMMON_BAD_REQUEST, 400, "OwnerId is required");
  }

  const createdAt = nowIso() as ISODateString;
  const envelopeId = ctx.ids.ulid() as unknown as EnvelopeId;

  const envelope: Envelope = Object.freeze({
    envelopeId,
    tenantId: input.tenantId,
    ownerId: input.ownerId,
    title,
    status: "draft",
    createdAt,
    updatedAt: createdAt,
    parties: [],
    documents: [],
  });

  await ctx.repos.envelopes.create(envelope);

  const event: DomainEvent = {
    id: ctx.ids.ulid(),
    type: "envelope.created",
    occurredAt: createdAt,
    payload: {
      envelopeId,
      ownerId: input.ownerId,
      title,
      actor: input.actor,
    },
    metadata: undefined,
  };

  return { envelope, events: [event] as const };
};
