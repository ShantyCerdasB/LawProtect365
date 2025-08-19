import type { Envelope } from "../../../domain/entities/Envelope";
import type { Mapper } from "@lawprotect/shared-ts";
import { BadRequestError } from "@lawprotect/shared-ts";
import { ErrorCodes } from "@lawprotect/shared-ts";

/**
 * @file EnvelopeItemMapper.ts
 *
 * Provides bidirectional mapping logic between the domain-level `Envelope` aggregate root
 * and its DynamoDB persistence representation (`EnvelopeItem`).
 *
 * DynamoDB structure:
 * - Primary key (PK) = ENVELOPE#<envelopeId>
 * - Sort key (SK) = META
 * - Global Secondary Index (GSI1) → OwnerId + UpdatedAt
 *
 * Ensures:
 * - Aggregation of parties and documents under the envelope.
 * - Owner-based query support via GSI1.
 * - Type safety with runtime validation.
 */

/** DynamoDB entity label */
export const ENVELOPE_ENTITY = "Envelope" as const;
const ENVELOPE_META = "META" as const;

/** Key builders */
export const envelopePk = (envelopeId: string): string => `ENVELOPE#${envelopeId}`;
export const envelopeMetaSk = (): string => ENVELOPE_META;
export const gsi1OwnerPk = (ownerId: string): string => `OWNER#${ownerId}`;
export const gsi1OwnerSk = (updatedAtIso: string): string => `ENVELOPE#${updatedAtIso}`;

/**
 * DynamoDB representation of an Envelope.
 */
export interface EnvelopeItem {
  pk: string;
  sk: string;
  type: typeof ENVELOPE_ENTITY;
  envelopeId: string;
  ownerId: string;
  title: string;
  status: Envelope["status"];
  createdAt: string;
  updatedAt: string;
  parties: string[];
  documents: string[];
  ttl?: number;
  gsi1pk?: string;
  gsi1sk?: string;
}

/**
 * Type guard for EnvelopeItem.
 *
 * @param value - Arbitrary object to validate.
 * @returns True if the value is an EnvelopeItem.
 */
export function isEnvelopeItem(value: unknown): value is EnvelopeItem {
  const o = value as EnvelopeItem;
  return (
    typeof o?.pk === "string" &&
    typeof o?.sk === "string" &&
    o.type === ENVELOPE_ENTITY
  );
}

/**
 * Mapper implementation for Envelope ↔ EnvelopeItem.
 */
export const envelopeItemMapper: Mapper<Envelope, EnvelopeItem> = {
  /**
   * Maps a domain `Envelope` entity into a DynamoDB `EnvelopeItem`.
   *
   * @param entity - Domain `Envelope` aggregate.
   * @returns DynamoDB-compatible `EnvelopeItem`.
   */
  toDTO(entity: Envelope): EnvelopeItem {
    return {
      pk: envelopePk(entity.envelopeId),
      sk: envelopeMetaSk(),
      type: ENVELOPE_ENTITY,
      envelopeId: entity.envelopeId,
      ownerId: entity.ownerId,
      title: entity.title,
      status: entity.status,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      parties: [...entity.parties],
      documents: [...entity.documents],
      gsi1pk: gsi1OwnerPk(entity.ownerId),
      gsi1sk: gsi1OwnerSk(entity.updatedAt),
    };
  },

  /**
   * Maps a DynamoDB `EnvelopeItem` into a domain `Envelope`.
   *
   * @param persisted - DynamoDB `EnvelopeItem`.
   * @returns Domain `Envelope` aggregate.
   * @throws BadRequestError if validation fails.
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
      envelopeId: persisted.envelopeId,
      ownerId: persisted.ownerId,
      title: persisted.title,
      status: persisted.status,
      createdAt: persisted.createdAt,
      updatedAt: persisted.updatedAt,
      parties: [...persisted.parties],
      documents: [...persisted.documents],
    });
  },
};
