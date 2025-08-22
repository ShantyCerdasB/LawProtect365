/**
 * @file auditItemMapper.ts
 * @summary Bidirectional mapper for AuditEvent ⇄ DynamoDB item.
 *
 * @description
 * Normalizes the persistence shape for immutable audit events using a single-table design:
 *
 * - Table keys:
 *   • `pk` = `TENANT#<tenantId>`
 *   • `sk` = `ENV#<envelopeId>#TS#<occurredAt>#ID#<id>`
 *
 * - Indexes:
 *   • GSI1 (by envelope): `gsi1pk` = `ENV#<tenantId>#<envelopeId>`, `gsi1sk` = `<occurredAt>#<id>`
 *   • GSI2 (by id):       `gsi2pk` = `ID#<id>`
 *
 * The mapper:
 * - Converts branded identifiers (domain) ⇄ plain strings (persistence).
 * - Emits stable key attributes and GSI keys.
 * - Provides a runtime guard before deserializing from DTOs.
 */

import type { Mapper } from "@lawprotect/shared-ts";
import { BadRequestError, ErrorCodes } from "@lawprotect/shared-ts";

import type { AuditEvent, AuditEventId } from "@/domain/value-objects/Audit";
import type { TenantId, EnvelopeId } from "@/domain/value-objects/Ids";

/** Stable entity marker for audit items. */
export const AUDIT_ENTITY = "AuditEvent" as const;

/* ────────────────────────────────────────────────────────────────────────── */
/* Key builders                                                              */
/* ────────────────────────────────────────────────────────────────────────── */

/** Builds the table partition key for an audit event. */
export const auditPk = (tenantId: string): string => `TENANT#${tenantId}`;
/** Builds the table sort key for an audit event (time-ordered within envelope). */
export const auditSk = (envelopeId: string, occurredAtIso: string, id: string): string =>
  `ENV#${envelopeId}#TS#${occurredAtIso}#ID#${id}`;

/** GSI1 (by envelope) partition key. */
export const gsi1Pk = (tenantId: string, envelopeId: string): string =>
  `ENV#${tenantId}#${envelopeId}`;
/** GSI1 (by envelope) sort key (ISO timestamp + tiebreaker id). */
export const gsi1Sk = (occurredAtIso: string, id: string): string =>
  `${occurredAtIso}#${id}`;

/** GSI2 (by id) partition key. */
export const gsi2Pk = (id: string): string => `ID#${id}`;

/* ────────────────────────────────────────────────────────────────────────── */
/* Persistence DTO                                                           */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * DynamoDB persistence shape for an immutable audit event.
 * Values are plain JSON-compatible types.
 */
export interface AuditItem {
  pk: string;
  sk: string;
  type: typeof AUDIT_ENTITY;

  /** Event payload */
  id: string;
  tenantId: string;
  envelopeId: string;
  occurredAt: string; // ISO-8601
  /** Domain event type, e.g., "envelope.created" */
  eventType: string;

  actor?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  prevHash?: string;
  hash?: string;

  /** Indexes */
  gsi1pk: string;
  gsi1sk: string;
  gsi2pk: string;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Type guard                                                                */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Runtime guard to ensure a raw object looks like an `AuditItem`.
 *
 * @param value Arbitrary value.
 * @returns `true` when minimal required fields are present.
 */
export function isAuditItem(value: unknown): value is AuditItem {
  const o = value as AuditItem;
  return (
    !!o &&
    typeof o === "object" &&
    typeof o.pk === "string" &&
    typeof o.sk === "string" &&
    o.type === AUDIT_ENTITY &&
    typeof o.id === "string" &&
    typeof o.tenantId === "string" &&
    typeof o.envelopeId === "string" &&
    typeof o.occurredAt === "string" &&
    typeof o.eventType === "string" &&
    typeof o.gsi1pk === "string" &&
    typeof o.gsi1sk === "string" &&
    typeof o.gsi2pk === "string"
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Mapper implementation                                                     */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Mapper for `AuditEvent` (domain) ⇄ `AuditItem` (persistence).
 *
 * Notes:
 * - Domain uses branded identifiers; persistence uses plain strings.
 * - The mapper is the boundary where casting happens.
 */
export const auditItemMapper: Mapper<AuditEvent, AuditItem> = {
  /**
   * Maps a domain `AuditEvent` into a DynamoDB `AuditItem`.
   *
   * @param ev Domain audit event.
   * @returns Persistence DTO compatible with DocumentClient.
   */
  toDTO(ev: AuditEvent): AuditItem {
    const id = ev.id as unknown as string;
    const tenantId = ev.tenantId as unknown as string;
    const envelopeId = ev.envelopeId as unknown as string;

    return {
      pk: auditPk(tenantId),
      sk: auditSk(envelopeId, ev.occurredAt, id),
      type: AUDIT_ENTITY,

      id,
      tenantId,
      envelopeId,
      occurredAt: ev.occurredAt,
      eventType: ev.type,

      actor: ev.actor ? { ...ev.actor } : undefined,
      metadata: ev.metadata ? { ...ev.metadata } : undefined,
      prevHash: ev.prevHash,
      hash: ev.hash,

      gsi1pk: gsi1Pk(tenantId, envelopeId),
      gsi1sk: gsi1Sk(ev.occurredAt, id),
      gsi2pk: gsi2Pk(id),
    };
  },

  /**
   * Maps a DynamoDB `AuditItem` back into a domain `AuditEvent`.
   *
   * @param dto Persistence item (already shaped as `AuditItem`).
   * @returns Domain audit event with branded identifiers.
   * @throws {BadRequestError} when the raw object does not match the expected shape.
   */
  fromDTO(dto: AuditItem): AuditEvent {
    if (!isAuditItem(dto)) {
      throw new BadRequestError(
        "Invalid persistence object for AuditEvent",
        ErrorCodes.COMMON_BAD_REQUEST,
        { received: dto }
      );
    }

    return Object.freeze<AuditEvent>({
      id: dto.id as unknown as AuditEventId,
      tenantId: dto.tenantId as unknown as TenantId,
      envelopeId: dto.envelopeId as unknown as EnvelopeId,
      type: dto.eventType,
      occurredAt: dto.occurredAt,
      actor: dto.actor ? { ...(dto.actor as Record<string, unknown>) } : undefined,
      metadata: dto.metadata ? { ...(dto.metadata as Record<string, unknown>) } : undefined,
      prevHash: dto.prevHash,
      hash: dto.hash,
    });
  },
};

/**
 * Convenience helper to map from a raw DocumentClient item into `AuditEvent`
 * without forcing callers to cast to `AuditItem` first.
 *
 * @param raw Raw item as returned by the client.
 * @returns Domain audit event.
 */
export const auditItemFromRaw = (raw: Record<string, unknown>): AuditEvent => {
  if (!isAuditItem(raw)) {
    throw new BadRequestError(
      "Invalid persistence object for AuditEvent",
      ErrorCodes.COMMON_BAD_REQUEST,
      { received: raw }
    );
  }
  return auditItemMapper.fromDTO(raw);
};
