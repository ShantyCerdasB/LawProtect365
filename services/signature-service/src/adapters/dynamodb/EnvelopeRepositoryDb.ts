/**
 * @file EnvelopeRepositoryDdb.ts
 * @description
 * DynamoDB-backed repository for the `Envelope` aggregate.
 * - Pure repository (no concrete SDK dependency; uses a `DdbClientLike` interface).
 * - Errors normalized via `mapAwsError` from the shared package.
 * - Implements the `Repository<Envelope>` contract.
 */

import type { Repository } from "@lawprotect/shared-ts";
import { ConflictError, NotFoundError } from "@lawprotect/shared-ts";
import { mapAwsError } from "@lawprotect/shared-ts";
import type { DdbClientLike } from "@lawprotect/shared-ts";
import type { Envelope } from "../../domain/entities/Envelope";
import {
  envelopeItemMapper,
  envelopePk,
  envelopeMetaSk,
} from "./__mappers__/envelopeItemMapper";


/**
 * Narrows a typed object into the loose shape required by DocumentClient
 * without mutating domain objects.
 */
const toDdbItem = <T extends object>(v: T): Record<string, unknown> =>
  (v as unknown) as Record<string, unknown>;

/**
 * DynamoDB implementation of Repository<Envelope>.
 */
export class EnvelopeRepositoryDdb
  implements Repository<Envelope, string, undefined>
{
  constructor(
    private readonly tableName: string,
    private readonly ddb: DdbClientLike
  ) {}

  /**
   * Loads an Envelope by id.
   * @param id Envelope identifier.
   * @returns The Envelope or `null` if not found.
   * @throws Normalized HttpError via `mapAwsError`.
   */
  async getById(id: string): Promise<Envelope | null> {
    try {
      const res = await this.ddb.get({
        TableName: this.tableName,
        Key: { pk: envelopePk(id), sk: envelopeMetaSk() },
      });
      return res.Item ? envelopeItemMapper.fromDTO(res.Item as any) : null;
    } catch (err) {
      throw mapAwsError(err, "EnvelopeRepositoryDdb.getById");
    }
  }

  /**
   * Checks if an Envelope exists.
   * @param id Envelope identifier.
   */
  async exists(id: string): Promise<boolean> {
    return (await this.getById(id)) !== null;
    // getById already normalizes AWS errors → no duplicate handling here
  }

  /**
   * Creates a new Envelope (fails if it already exists).
   * @param entity Domain aggregate to persist.
   * @throws ConflictError if it already exists; other errors are normalized with `mapAwsError`.
   */
  async create(entity: Envelope): Promise<Envelope> {
    try {
      await this.ddb.put({
        TableName: this.tableName,
        Item: toDdbItem(envelopeItemMapper.toDTO(entity)),
        ConditionExpression:
          "attribute_not_exists(pk) AND attribute_not_exists(sk)",
      });
      return entity;
    } catch (err: any) {
      if (String(err?.name) === "ConditionalCheckFailedException") {
        throw new ConflictError("Envelope already exists");
      }
      throw mapAwsError(err, "EnvelopeRepositoryDdb.create");
    }
  }

  /**
   * Partially updates an Envelope using read–modify–write.
   * Whitelists fields and bumps `updatedAt`.
   * @param id Envelope identifier.
   * @param patch Partial fields to update.
   * @throws NotFoundError if it does not exist; other errors are normalized.
   */
  async update(id: string, patch: Partial<Envelope>): Promise<Envelope> {
    try {
      const current = await this.getById(id);
      if (!current) throw new NotFoundError("Envelope not found");

      const next: Envelope = Object.freeze({
        ...current,
        title: patch.title ?? current.title,
        status: patch.status ?? current.status,
        parties: patch.parties ?? current.parties,
        documents: patch.documents ?? current.documents,
        updatedAt: new Date().toISOString(),
      });

      await this.ddb.put({
        TableName: this.tableName,
        Item: toDdbItem(envelopeItemMapper.toDTO(next)),
        ConditionExpression:
          "attribute_exists(pk) AND attribute_exists(sk)",
      });

      return next;
    } catch (err: any) {
      if (String(err?.name) === "ConditionalCheckFailedException") {
        throw new NotFoundError("Envelope not found");
      }
      throw mapAwsError(err, "EnvelopeRepositoryDdb.update");
    }
  }

  /**
   * Deletes an Envelope by id.
   * @param id Envelope identifier.
   * @throws NotFoundError if it does not exist; other errors are normalized.
   */
  async delete(id: string): Promise<void> {
    try {
      await this.ddb.delete({
        TableName: this.tableName,
        Key: { pk: envelopePk(id), sk: envelopeMetaSk() },
        ConditionExpression:
          "attribute_exists(pk) AND attribute_exists(sk)",
      });
    } catch (err: any) {
      if (String(err?.name) === "ConditionalCheckFailedException") {
        throw new NotFoundError("Envelope not found");
      }
      throw mapAwsError(err, "EnvelopeRepositoryDdb.delete");
    }
  }
}
