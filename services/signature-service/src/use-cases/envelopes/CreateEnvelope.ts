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

/**
 * Minimal actor context propagated for attribution/auditing purposes.
 */
export interface ActorContext {
  userId?: string;
  email?: string;
  ip?: string;
  userAgent?: string;
  locale?: string;
}

/**
 * Input contract for CreateEnvelope.
 */
export interface CreateEnvelopeInput {
  tenantId: TenantId;
  ownerId: UserId;
  title: string;
  /** Optional actor context for downstream subscribers. */
  actor?: ActorContext;
}

/**
 * Output contract for CreateEnvelope.
 */
export interface CreateEnvelopeOutput {
  envelope: Envelope;
  /** Domain events emitted by this use case. */
  events: ReadonlyArray<DomainEvent>;
}

/**
 * Execution context for CreateEnvelope.
 */
export interface CreateEnvelopeContext {
  repos: {
    envelopes: Repository<Envelope, EnvelopeId>;
  };
  ids: {
    /** Monotonic or time-ordered id generator (e.g., ULID). */
    ulid(): string;
  };
}

/**
 * Creates a new envelope with status "draft" and emits `envelope.created`.
 *
 * @throws {AppError} 400 when invariants are violated.
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
