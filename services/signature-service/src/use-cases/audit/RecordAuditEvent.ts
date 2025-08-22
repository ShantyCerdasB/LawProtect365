/**
 * @file RecordAuditEvent.ts
 * @summary Records a new immutable audit event (append-only).
 *
 * @description
 * Pure application use case over the `AuditRepository` port. Normalizes inputs
 * and validates with domain rules before persistence. The repository is
 * responsible for assigning `id`, computing `hash`/`prevHash`, and enforcing
 * append-only semantics.
 */

import type { AuditEvent } from "@/domain/value-objects/Audit";
import type { EnvelopeId, TenantId } from "@/domain/value-objects/Ids";
import * as Rules from "@/domain/rules";
import type { AuditRepository } from "@/ports";

/** Allowed audit event types (extend as needed). */
export type AuditEventType =
  | "envelope.created"
  | "envelope.sent"
  | "envelope.completed"
  | "envelope.cancelled"
  | "envelope.declined"
  | "document.attached"
  | "document.removed"
  | "party.added"
  | "party.delegated"
  | "otp.requested"
  | "otp.verified"
  | "consent.submitted"
  | "signature.submitted"
  | "upload.presigned"
  | "upload.completed";

/** Actor metadata attached to an audit event. */
export interface AuditActor {
  userId?: string;
  email?: string;
  ip?: string;
  userAgent?: string;
  locale?: string;
}

/** Input contract. */
export interface RecordAuditEventInput {
  tenantId: TenantId;
  envelopeId: EnvelopeId;
  type: AuditEventType | string;
  occurredAt?: string;
  actor?: AuditActor;
  metadata?: Record<string, unknown>;
  /** Optional previous hash hint for strict chain enforcement. */
  prevHashHint?: string;
}

/** Output contract. */
export interface RecordAuditEventOutput {
  event: AuditEvent;
}

/** Use case context. */
export interface RecordAuditEventContext {
  repos: {
    audit: AuditRepository;
  };
}

/**
 * Records a new immutable audit event.
 */
export const recordAuditEvent = async (
  input: RecordAuditEventInput,
  ctx: RecordAuditEventContext
): Promise<RecordAuditEventOutput> => {
  const occurredAt = input.occurredAt ?? new Date().toISOString();

  Rules.Audit.assertEventType(input.type);
  if (input.actor) Rules.Audit.assertActorShape(input.actor);
  if (input.metadata) Rules.Audit.assertMetadataSerializable(input.metadata);

  const candidate: Omit<AuditEvent, "id" | "hash"> & { prevHash?: string } = {
    tenantId: input.tenantId,
    envelopeId: input.envelopeId,
    type: input.type,
    occurredAt,
    actor: input.actor ? { ...input.actor } : undefined,
    metadata: input.metadata ? { ...input.metadata } : undefined,
    prevHash: input.prevHashHint,
  };

  const saved = await ctx.repos.audit.record(candidate);

  Rules.Audit.assertChainLink(saved);
  Rules.Audit.assertImmutable(saved);

  return { event: saved };
};
