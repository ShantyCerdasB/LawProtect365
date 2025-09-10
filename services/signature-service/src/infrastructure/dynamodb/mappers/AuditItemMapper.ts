/**
 * @file auditItemMapper.ts
 * @summary Bidirectional mapper for AuditEvent ⇄ DynamoDB item.
 *
 * @description
 * Normalizes the persistence shape for immutable audit events using a single-table design:
 *
 * - Table keys:
 *   • `sk` = `ENV#<envelopeId>#TS#<occurredAt>#ID#<id>`
 *
 * - Indexes:
 *   • GSI1 (by envelope): `gsi1pk` =
 *   • GSI2 (by id):       `gsi2pk` = `ID#<id>`
 *
 * The mapper:
 * - Converts branded identifiers (domain) ⇄ plain strings (persistence).
 * - Emits stable key attributes and GSI keys.
 * - Provides a runtime guard before deserializing from DTOs.
 */

import type { Mapper } from "@lawprotect/shared-ts";
import { BadRequestError, ErrorCodes } from "@lawprotect/shared-ts";

import type { AuditEvent, AuditEventId } from "@/domain/value-objects/audit";
import type { EnvelopeId } from "@/domain/value-objects/ids";

import { AUDIT_ENTITY_TYPE } from "../../../domain/types/infrastructure/enums";
import { DdbAuditItem, isDdbAuditItem } from "@/domain/entities";

/* ────────────────────────────────────────────────────────────────────────── */
/* Key builders                                                              */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * @summary Builds the table partition key for an audit event
 * @description Builds the table partition key for an audit event.
 * @returns Partition key string
 */
export const auditPk = (): string => `AUDIT`;

/**
 * @summary Builds the table sort key for an audit event (time-ordered within envelope)
 * @description Builds the table sort key for an audit event (time-ordered within envelope).
 * @param envelopeId - Envelope identifier
 * @param occurredAtIso - ISO timestamp
 * @param id - Event identifier
 * @returns Sort key string
 */
export const auditSk = (envelopeId: string, occurredAtIso: string, id: string): string =>
  `ENV#${envelopeId}#TS#${occurredAtIso}#ID#${id}`;

/**
 * @summary GSI1 (by envelope) partition key
 * @description GSI1 (by envelope) partition key.
 * @param envelopeId - Envelope identifier
 * @returns GSI1 partition key string
 */
export const gsi1Pk = (envelopeId: string): string =>
  `ENV#${envelopeId}`;

/**
 * @summary GSI1 (by envelope) sort key (ISO timestamp + tiebreaker id)
 * @description GSI1 (by envelope) sort key (ISO timestamp + tiebreaker id).
 * @param occurredAtIso - ISO timestamp
 * @param id - Event identifier
 * @returns GSI1 sort key string
 */
export const gsi1Sk = (occurredAtIso: string, id: string): string =>
  `${occurredAtIso}#${id}`;

/**
 * @summary GSI2 (by id) partition key
 * @description GSI2 (by id) partition key.
 * @param id - Event identifier
 * @returns GSI2 partition key string
 */
export const gsi2Pk = (id: string): string => `ID#${id}`;

/* ────────────────────────────────────────────────────────────────────────── */
/* Mapper implementation                                                     */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * @summary Mapper for `AuditEvent` (domain) ⇄ `DdbAuditItem` (persistence)
 * @description Mapper for `AuditEvent` (domain) ⇄ `DdbAuditItem` (persistence).
 * Notes:
 * - Domain uses branded identifiers; persistence uses plain strings.
 * - The mapper is the boundary where casting happens.
 */
export const auditItemMapper: Mapper<AuditEvent, DdbAuditItem> = {
  /**
   * @summary Maps a domain `AuditEvent` into a DynamoDB `DdbAuditItem`
   * @description Maps a domain `AuditEvent` into a DynamoDB `DdbAuditItem`.
   * @param ev - Domain audit event
   * @returns Persistence DTO compatible with DocumentClient
   */
  toDTO(ev: AuditEvent): DdbAuditItem {
    const id = ev.id as unknown as string;
    const envelopeId = ev.envelopeId as unknown as string;

    const item: Record<string, any> = {
      pk: auditPk(),
      sk: auditSk(envelopeId, ev.occurredAt, id),
      type: AUDIT_ENTITY_TYPE,

      id,
      envelopeId,
      occurredAt: ev.occurredAt,
      eventType: ev.type,

      gsi1pk: gsi1Pk(envelopeId),
      gsi1sk: gsi1Sk(ev.occurredAt, id),
      gsi2pk: gsi2Pk(id)
    };

    // Only add optional fields if they have values
    if (ev.actor) {
      item.actor = { ...ev.actor };
    }
    if (ev.metadata) {
      item.metadata = { ...ev.metadata };
    }
    if (ev.prevHash) {
      item.prevHash = ev.prevHash;
    }
    if (ev.hash) {
      item.hash = ev.hash;
    }

    return item as DdbAuditItem;
  },

  /**
   * @summary Maps a DynamoDB `DdbAuditItem` back into a domain `AuditEvent`
   * @description Maps a DynamoDB `DdbAuditItem` back into a domain `AuditEvent`.
   * @param dto - Persistence item (already shaped as `DdbAuditItem`)
   * @returns Domain audit event with branded identifiers
   * @throws {BadRequestError} when the raw object does not match the expected shape
   */
  fromDTO(dto: DdbAuditItem): AuditEvent {
    if (!isDdbAuditItem(dto)) {
      throw new BadRequestError(
        "Invalid persistence object for AuditEvent",
        ErrorCodes.COMMON_BAD_REQUEST,
        { received: dto }
      );
    }

    return Object.freeze<AuditEvent>({
      id: dto.id as unknown as AuditEventId,
      envelopeId: dto.envelopeId as unknown as EnvelopeId,
      type: dto.eventType,
      occurredAt: dto.occurredAt,
      actor: dto.actor ? { ...(dto.actor as Record<string, unknown>) } : undefined,
      metadata: dto.metadata ? { ...(dto.metadata as Record<string, unknown>) } : undefined,
      prevHash: dto.prevHash,
      hash: dto.hash});
  }};

/**
 * @summary Convenience helper to map from a raw DocumentClient item into `AuditEvent`
 * @description Convenience helper to map from a raw DocumentClient item into `AuditEvent`
 * without forcing callers to cast to `DdbAuditItem` first.
 * @param raw - Raw item as returned by the client
 * @returns Domain audit event
 */
export const auditItemFromRaw = (raw: Record<string, unknown>): AuditEvent => {
  if (!isDdbAuditItem(raw)) {
    throw new BadRequestError(
      "Invalid persistence object for AuditEvent",
      ErrorCodes.COMMON_BAD_REQUEST,
      { received: raw }
    );
  }
  return auditItemMapper.fromDTO(raw as DdbAuditItem);
};

