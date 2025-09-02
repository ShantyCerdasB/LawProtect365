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
 * @description Narrows a typed object into the loose `Record<string, unknown>` shape
 * expected by generic DynamoDB clients, without mutating the input.
 * @typeParam T - Source object type.
 * @param {T} v Source object.
 * @returns {Record<string, unknown>} A `Record<string, unknown>` view of the source object.
 */
const toDdbItem = <T extends object>(v: T): Record<string, unknown> =>
  (v as unknown) as Record<string, unknown>;

import { PartyKey } from "../../shared/types/infrastructure/dynamodb";

/**
 * @description DynamoDB implementation of `Repository<Party, PartyKey>`.
 * Uses composite keys because `Party` rows are scoped to their `Envelope`.
 */
export class PartyRepositoryDdb
  implements Repository<Party, PartyKey, undefined>
{
  /**
   * @description Creates a new repository instance.
   * @param {string} tableName DynamoDB table name.
   * @param {DdbClientLike} ddb Minimal DynamoDB client.
   */
  constructor(
    private readonly tableName: string,
    private readonly ddb: DdbClientLike
  ) {}

  /**
   * @description Loads a `Party` by `(envelopeId, partyId)`.
   * @param {PartyKey} key Composite key `{ envelopeId, partyId }`.
   * @returns {Promise<Party | null>} The `Party` or `null` if not found.
   * @throws {HttpError} Normalized AWS error (e.g., throttling) via `mapAwsError`.
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
   * @description Checks whether a `Party` exists.
   * @param {PartyKey} key Composite key `{ envelopeId, partyId }`.
   * @returns {Promise<boolean>} `true` when found; otherwise `false`.
   * @throws {HttpError} Normalized AWS error via `mapAwsError`.
   */
  async exists(key: PartyKey): Promise<boolean> {
    return (await this.getById(key)) !== null;
  }

  /**
   * @description Creates a new `Party`. Fails if the item already exists.
   * @param {Party} entity Domain entity to persist.
   * @returns {Promise<Party>} The same `Party` entity.
   * @throws {ConflictError} When the conditional write fails (already exists).
   * @throws {HttpError} Normalized AWS error via `mapAwsError`.
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
   * @description Partially updates a `Party` via read–modify–write.
   * Only whitelisted fields are updated.
   * @param {PartyKey} key Composite key `{ envelopeId, partyId }`.
   * @param {Partial<Party>} patch Partial fields to update.
   * @returns {Promise<Party>} The updated `Party`.
   * @throws {NotFoundError} When the item does not exist.
   * @throws {HttpError} Normalized AWS error via `mapAwsError`.
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
   * @description Deletes a `Party` by `(envelopeId, partyId)`.
   * @param {PartyKey} key Composite key `{ envelopeId, partyId }`.
   * @returns {Promise<void>} Resolves when the item has been deleted.
   * @throws {NotFoundError} When the item does not exist.
   * @throws {HttpError} Normalized AWS error via `mapAwsError`.
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

  /**
   * @description Lists parties by envelope with optional filtering.
   * @param {object} input Input parameters for listing parties.
   * @returns {Promise<object>} List result with parties and pagination info.
   */
  async listByEnvelope(input: {
    tenantId: string;
    envelopeId: string;
    role?: string;
    status?: string;
    limit?: number;
    cursor?: string;
  }): Promise<{ items: Party[]; nextCursor?: string; total: number }> {
    try {
      const queryParams: any = {
        TableName: this.tableName,
        KeyConditionExpression: "pk = :pk",
        ExpressionAttributeValues: {
          ":pk": partyPk(input.envelopeId),
        },
        Limit: input.limit || 20,
      };

      // Add filters if provided
      let filterExpressions: string[] = [];

      if (input.role) {
        filterExpressions.push("#role = :role");
        if (!queryParams.ExpressionAttributeNames) {
          queryParams.ExpressionAttributeNames = {};
        }
        queryParams.ExpressionAttributeNames["#role"] = "role";
        queryParams.ExpressionAttributeValues[":role"] = input.role;
      }

      if (input.status) {
        filterExpressions.push("#status = :status");
        if (!queryParams.ExpressionAttributeNames) {
          queryParams.ExpressionAttributeNames = {};
        }
        queryParams.ExpressionAttributeNames["#status"] = "status";
        queryParams.ExpressionAttributeValues[":status"] = input.status;
      }

      if (filterExpressions.length > 0) {
        queryParams.FilterExpression = filterExpressions.join(" AND ");
      }

      if (input.cursor) {
        queryParams.ExclusiveStartKey = JSON.parse(input.cursor);
      }

      const result = await this.ddb.query(queryParams);

      const parties = (result.Items || []).map((item) =>
        partyItemMapper.fromDTO(item as any)
      );

      return {
        items: parties,
        nextCursor: result.LastEvaluatedKey
          ? JSON.stringify(result.LastEvaluatedKey)
          : undefined,
        total: parties.length,
      };
    } catch (err) {
      throw mapAwsError(err, "PartyRepositoryDdb.listByEnvelope");
    }
  }

  /**
   * @description Gets parties by email within an envelope.
   * @param {object} input Input parameters for searching by email.
   * @returns {Promise<object>} Search result with parties.
   */
  async getByEmail(input: {
    tenantId: string;
    envelopeId: string;
    email: string;
  }): Promise<{ items: Party[] }> {
    try {
      const result = await this.ddb.query({
        TableName: this.tableName,
        KeyConditionExpression: "pk = :pk",
        FilterExpression: "#email = :email",
        ExpressionAttributeNames: {
          "#email": "email",
        },
        ExpressionAttributeValues: {
          ":pk": partyPk(input.envelopeId),
          ":email": input.email,
        },
      });

      const parties = (result.Items || []).map((item) =>
        partyItemMapper.fromDTO(item as any)
      );

      return {
        items: parties,
      };
    } catch (err) {
      throw mapAwsError(err, "PartyRepositoryDdb.getByEmail");
    }
  }

  /**
   * @description Updates a party entity (for compatibility with new adapters).
   * @param {Party} party The party entity to update.
   */
  async updateParty(party: Party): Promise<void> {
    await this.update(
      { envelopeId: party.envelopeId, partyId: party.partyId },
      party
    );
  }

  /**
   * @description Deletes a party by ID and envelope ID (for compatibility with new adapters).
   * @param {string} partyId The party ID.
   * @param {string} envelopeId The envelope ID.
   */
  async deleteParty(partyId: string, envelopeId: string): Promise<void> {
    await this.delete({ envelopeId, partyId });
  }
}
