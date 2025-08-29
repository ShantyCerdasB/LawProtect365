/**
 * @file PartyRepositoryDdb.ts
 * @summary DynamoDB-backed repository for the `Party` aggregate (child of Envelope).
 * @description
 * Single-table access pattern:
 *   - PK = "ENVELOPE#<envelopeId>"
 *   - SK = "PARTY#<partyId>"
 * This repository is SDK-agnostic and relies on a minimal `DdbClientLike` interface.
 * Errors are normalized to shared HttpErrors via `mapAwsError`.
 */

import type { Repository } from "@lawprotect/shared-ts";
import { ConflictError, NotFoundError } from "@lawprotect/shared-ts";
import { mapAwsError } from "@lawprotect/shared-ts";
import type { DdbClientLike } from "@lawprotect/shared-ts";
import type { Party } from "../../domain/entities/Party";
import {
  partyItemMapper,
  partyPk,
  partySk,
} from "./mappers/partyItemMapper";

/**
 * Narrows a typed object into the loose `Record<string, unknown>` shape
 * expected by generic DynamoDB clients, without mutating the input.
 * @typeParam T - Source object type.
 * @param v Source object.
 * @returns A `Record<string, unknown>` view of the source object.
 */
const toDdbItem = <T extends object>(v: T): Record<string, unknown> =>
  (v as unknown) as Record<string, unknown>;

/**
 * Composite identifier used by this repository.
 * - `envelopeId` scopes all parties.
 * - `partyId` identifies the specific party.
 */
export type PartyKey = { envelopeId: string; partyId: string };

/**
 * DynamoDB implementation of `Repository<Party, PartyKey>`.
 * Uses composite keys because `Party` rows are scoped to their `Envelope`.
 */
export class PartyRepositoryDdb
  implements Repository<Party, PartyKey, undefined>
{
  /**
   * Creates a new repository instance.
   * @param tableName DynamoDB table name.
   * @param ddb Minimal DynamoDB client.
   */
  constructor(
    private readonly tableName: string,
    private readonly ddb: DdbClientLike
  ) {}

  /**
   * Loads a `Party` by `(envelopeId, partyId)`.
   * @param key Composite key `{ envelopeId, partyId }`.
   * @returns The `Party` or `null` if not found.
   * @throws HttpError Normalized AWS error (e.g., throttling) via `mapAwsError`.
   */
  async getById(key: PartyKey): Promise<Party | null> {
    try {
      const res = await this.ddb.get({
        TableName: this.tableName,
        Key: { pk: partyPk(key.envelopeId), sk: partySk(key.partyId) },
      });
      return res.Item ? partyItemMapper.fromDTO(res.Item as any) : null;
    } catch (err) {
      throw mapAwsError(err, "PartyRepositoryDdb.getById");
    }
  }

  /**
   * Checks whether a `Party` exists.
   * @param key Composite key `{ envelopeId, partyId }`.
   * @returns `true` when found; otherwise `false`.
   * @throws HttpError Normalized AWS error via `mapAwsError`.
   */
  async exists(key: PartyKey): Promise<boolean> {
    return (await this.getById(key)) !== null;
  }

  /**
   * Creates a new `Party`. Fails if the item already exists.
   * @param entity Domain entity to persist.
   * @returns The same `Party` entity.
   * @throws ConflictError When the conditional write fails (already exists).
   * @throws HttpError Normalized AWS error via `mapAwsError`.
   */
  async create(entity: Party): Promise<Party> {
    try {
      await this.ddb.put({
        TableName: this.tableName,
        Item: toDdbItem(partyItemMapper.toDTO(entity)),
        ConditionExpression:
          "attribute_not_exists(pk) AND attribute_not_exists(sk)",
      });
      return entity;
    } catch (err: any) {
      if (String(err?.name) === "ConditionalCheckFailedException") {
        throw new ConflictError("Party already exists");
      }
      throw mapAwsError(err, "PartyRepositoryDdb.create");
    }
  }

  /**
   * Partially updates a `Party` via read–modify–write.
   * Only whitelisted fields are updated.
   * @param key Composite key `{ envelopeId, partyId }`.
   * @param patch Partial fields to update.
   * @returns The updated `Party`.
   * @throws NotFoundError When the item does not exist.
   * @throws HttpError Normalized AWS error via `mapAwsError`.
   */
  async update(key: PartyKey, patch: Partial<Party>): Promise<Party> {
    try {
      const current = await this.getById(key);
      if (!current) throw new NotFoundError("Party not found");

      const next: Party = Object.freeze({
        ...current,
        email: patch.email ?? current.email,
        role: patch.role ?? current.role,
        status: patch.status ?? current.status,
        signedAt: patch.signedAt ?? current.signedAt,
        otpState: patch.otpState ?? current.otpState,
      });

      await this.ddb.put({
        TableName: this.tableName,
        Item: toDdbItem(partyItemMapper.toDTO(next)),
        ConditionExpression:
          "attribute_exists(pk) AND attribute_exists(sk)",
      });

      return next;
    } catch (err: any) {
      if (String(err?.name) === "ConditionalCheckFailedException") {
        throw new NotFoundError("Party not found");
      }
      throw mapAwsError(err, "PartyRepositoryDdb.update");
    }
  }

  /**
   * Deletes a `Party` by `(envelopeId, partyId)`.
   * @param key Composite key `{ envelopeId, partyId }`.
   * @returns Resolves when the item has been deleted.
   * @throws NotFoundError When the item does not exist.
   * @throws HttpError Normalized AWS error via `mapAwsError`.
   */
  async delete(key: PartyKey): Promise<void> {
    try {
      await this.ddb.delete({
        TableName: this.tableName,
        Key: { pk: partyPk(key.envelopeId), sk: partySk(key.partyId) },
        ConditionExpression:
          "attribute_exists(pk) AND attribute_exists(sk)",
      });
    } catch (err: any) {
      if (String(err?.name) === "ConditionalCheckFailedException") {
        throw new NotFoundError("Party not found");
      }
      throw mapAwsError(err, "PartyRepositoryDdb.delete");
    }
  }
}
