/**
 * @file envelopeItemMapper.ts
 * @description Bidirectional mapper between domain Envelope aggregate and DynamoDB persistence representation.
 * Handles conversion between domain entities and DynamoDB items with proper key generation and validation.
 */

/**
 * @file EnvelopeItemMapper.ts
 * @summary Bidirectional mapper between the domain `Envelope` aggregate
 * and its DynamoDB persistence representation (`EnvelopeItem`).
 *
 * @description
 * Single-table layout:
 * - PK = `ENVELOPE#<envelopeId>`
 * - SK = `META`
 *
 * Owner-based listing (example GSI):
 * - GSI1PK = `OWNER#<ownerId>`
 * - GSI1SK = `ENVELOPE#<updatedAtISO>`
 *
 * This mapper:
 * - Converts branded ids (domain) ⇄ plain strings (persistence).
 * - Emits stable key attributes and optional GSI keys.
 * - Performs a lightweight runtime guard before mapping from DTO.
 */

import type { Envelope } from "@/domain/entities/Envelope";
import type { EnvelopeId, TenantId, UserId } from "@/domain/value-objects";
import type { Mapper } from "@lawprotect/shared-ts";
import { BadRequestError, ErrorCodes } from "@lawprotect/shared-ts";

/** @description DynamoDB entity label for Envelope rows */
export const ENVELOPE_ENTITY = "Envelope" as const;
/** @description Fixed sort key for Envelope meta row */
const ENVELOPE_META = "META" as const;

/* ────────────────────────────────────────────────────────────────────────── */
/* Key builders                                                              */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * @description Builds the partition key for an envelope.
 *
 * @param {string} envelopeId - The envelope identifier
 * @returns {string} DynamoDB partition key
 */
export const envelopePk = (envelopeId: string): string => `ENVELOPE#${envelopeId}`;

/**
 * @description Returns the fixed meta sort key.
 *
 * @returns {string} Fixed meta sort key
 */
export const envelopeMetaSk = (): string => ENVELOPE_META;

/**
 * @description Example owner-based GSI partition key.
 *
 * @param {string} ownerId - The owner identifier
 * @returns {string} GSI partition key
 */
export const gsi1OwnerPk = (ownerId: string): string => `OWNER#${ownerId}`;

/**
 * @description Example owner-based GSI sort key (stable, time-sortable).
 *
 * @param {string} updatedAtIso - ISO timestamp for sorting
 * @returns {string} GSI sort key
 */
export const gsi1OwnerSk = (updatedAtIso: string): string => `ENVELOPE#${updatedAtIso}`;

/* ────────────────────────────────────────────────────────────────────────── */
/* Persistence DTO                                                           */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * @description DynamoDB persistence shape for an `Envelope` meta row.
 * Values are plain strings/arrays for storage compatibility.
 */
export interface EnvelopeItem {
  /** DynamoDB partition key */
  pk: string;
  /** DynamoDB sort key */
  sk: string;
  /** Entity type identifier */
  type: typeof ENVELOPE_ENTITY;

  /** Envelope identifier */
  envelopeId: string;
  /** Tenant identifier (stored as plain string) */
  tenantId: string;
  /** Owner identifier (stored as plain string) */
  ownerId: string;

  /** Envelope title */
  title: string;
  /** Envelope status */
  status: Envelope["status"];
  /** Creation timestamp (ISO-8601) */
  createdAt: string;
  /** Last update timestamp (ISO-8601) */
  updatedAt: string;

  /** Array of party identifiers */
  parties: string[];
  /** Array of document identifiers */
  documents: string[];

  /** Optional TTL & GSI keys (presence depends on your table/index design) */
  ttl?: number;
  /** GSI1 partition key */
  gsi1pk?: string;
  /** GSI1 sort key */
  gsi1sk?: string;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Type guard                                                                */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * @description Runtime guard to ensure the raw item looks like an `EnvelopeItem`.
 * Performs lightweight validation before mapping from DTO.
 *
 * @param {unknown} value - Arbitrary object to validate
 * @returns {boolean} `true` if the value has the minimal required envelope shape
 */
export function isEnvelopeItem(value: unknown): value is EnvelopeItem {
  const o = value as EnvelopeItem;
  return (
    o !== null &&
    typeof o === "object" &&
    typeof o.pk === "string" &&
    typeof o.sk === "string" &&
    o.type === ENVELOPE_ENTITY &&
    typeof o.envelopeId === "string"
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Mapper implementation                                                     */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Mapper for Envelope ↔ EnvelopeItem.
 *
 * Notes on branded ids:
 * - Domain uses branded ids (`EnvelopeId`, `TenantId`, `UserId`).
 * - Persistence stores plain strings.
 * - The mapper is the boundary where casting happens.
 */
export const envelopeItemMapper: Mapper<Envelope, EnvelopeItem> = {
  /**
   * Maps a domain `Envelope` into a DynamoDB `EnvelopeItem`.
   *
   * @param entity Domain aggregate.
   * @returns Persistence DTO compatible with DocumentClient.
   */
  toDTO(entity: Envelope): EnvelopeItem {
    const envelopeIdStr = entity.envelopeId as unknown as string;
    const tenantIdStr   = entity.tenantId   as unknown as string;
    const ownerIdStr    = (entity.ownerId as UserId | string) as unknown as string;

    return {
      pk: envelopePk(envelopeIdStr),
      sk: envelopeMetaSk(),
      type: ENVELOPE_ENTITY,

      envelopeId: envelopeIdStr,
      tenantId: tenantIdStr,
      ownerId: ownerIdStr,

      title: entity.title,
      status: entity.status,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,

      parties: [...(entity.parties ?? [])],
      documents: [...(entity.documents ?? [])],

      // Example owner-based GSI (optional; include only if your table defines it)
      gsi1pk: gsi1OwnerPk(ownerIdStr),
      gsi1sk: gsi1OwnerSk(entity.updatedAt),
    };
  },

  /**
   * Maps a DynamoDB `EnvelopeItem` back into a domain `Envelope`.
   *
   * @param persisted Raw persistence item.
   * @returns Domain aggregate with branded ids and frozen arrays.
   * @throws BadRequestError if the raw item does not match the expected shape.
   */
  fromDTO(persisted: EnvelopeItem): Envelope {
    if (!isEnvelopeItem(persisted)) {
      throw new BadRequestError(
        "Invalid persistence object for Envelope",
        ErrorCodes.COMMON_BAD_REQUEST,
        { received: persisted }
      );
    }

    return Object.freeze<Envelope>({
      envelopeId: persisted.envelopeId as EnvelopeId,
      tenantId: persisted.tenantId as TenantId,
      ownerId: persisted.ownerId as UserId,

      title: persisted.title,
      status: persisted.status,
      createdAt: persisted.createdAt,
      updatedAt: persisted.updatedAt,
      parties: [...persisted.parties],
      documents: [...persisted.documents],
    });
  },
};
