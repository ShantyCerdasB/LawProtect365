/**
 * @file InputRepositoryDdb.ts
 * @summary DynamoDB-backed repository for the `Input` entity.
 * @description
 * Single-table pattern:
 *   - PK = "ENVELOPE#<envelopeId>"
 *   - SK = "INPUT#<inputId>"
 * The repository is SDK-agnostic (uses `DdbClientLike`) and normalizes provider
 * errors via `mapAwsError`. Implements `Repository<Input, InputId>`.
 */

import type { Repository } from "@lawprotect/shared-ts";
import { ConflictError, NotFoundError } from "@lawprotect/shared-ts";
import { mapAwsError } from "@lawprotect/shared-ts";
import { nowIso } from "@lawprotect/shared-ts";
import type { DdbClientLike } from "@lawprotect/shared-ts";
import type { Input } from "../../domain/entities/Input";
import {
  inputItemMapper,
  inputPk,
  inputSk,
} from "./mappers/inputItemMapper";


/**
 * Narrows a typed object to `Record<string, unknown>` expected by generic clients.
 * @typeParam T Source object type.
 * @param v Source object.
 * @returns Loosened record view of the source object.
 */
const toDdbItem = <T extends object>(v: T): Record<string, unknown> =>
  (v as unknown) as Record<string, unknown>;

/**
 * Composite identifier for Input rows.
 * - `envelopeId` scopes inputs.
 * - `inputId` identifies the input within the envelope.
 */
export type InputId = { envelopeId: string; inputId: string };

/**
 * DynamoDB implementation of `Repository<Input, InputId>`.
 */
export class InputRepositoryDdb
  implements Repository<Input, InputId, undefined>
{
  /**
   * Creates a repository instance.
   * @param tableName DynamoDB table name.
   * @param ddb Minimal DynamoDB client.
   */
  constructor(
    private readonly tableName: string,
    private readonly ddb: DdbClientLike
  ) {}

  /**
   * Loads an Input by composite id.
   * @param id Composite id `{ envelopeId, inputId }`.
   * @returns The `Input` or `null` if not found.
   * @throws HttpError Normalized provider error via `mapAwsError`.
   */
  async getById(id: InputId): Promise<Input | null> {
    try {
      const res = await this.ddb.get({
        TableName: this.tableName,
        Key: { pk: inputPk(id.envelopeId), sk: inputSk(id.inputId) },
      });
      return res.Item ? inputItemMapper.fromDTO(res.Item as any) : null;
    } catch (err) {
      throw mapAwsError(err, "InputRepositoryDdb.getById");
    }
  }

  /**
   * Checks whether an Input exists.
   * @param id Composite id `{ envelopeId, inputId }`.
   * @returns `true` if the item exists; otherwise `false`.
   */
  async exists(id: InputId): Promise<boolean> {
    return (await this.getById(id)) !== null;
  }

  /**
   * Creates a new Input. Fails if it already exists.
   * @param entity Domain entity to persist.
   * @returns The persisted entity (same reference).
   * @throws ConflictError When the conditional write fails due to preexistence.
   * @throws HttpError Normalized provider error via `mapAwsError`.
   */
  async create(entity: Input): Promise<Input> {
    try {
      await this.ddb.put({
        TableName: this.tableName,
        Item: toDdbItem(inputItemMapper.toDTO(entity)),
        ConditionExpression:
          "attribute_not_exists(pk) AND attribute_not_exists(sk)",
      });
      return entity;
    } catch (err: any) {
      if (String(err?.name) === "ConditionalCheckFailedException") {
        throw new ConflictError("Input already exists");
      }
      throw mapAwsError(err, "InputRepositoryDdb.create");
    }
  }

  /**
   * Partially updates an Input using read–modify–write.
   * Only whitelisted fields are updated; identifiers and `createdAt` remain immutable.
   * @param id Composite id `{ envelopeId, inputId }`.
   * @param patch Partial fields to apply.
   * @returns The updated `Input`.
   * @throws NotFoundError When the item does not exist.
   * @throws HttpError Normalized provider error via `mapAwsError`.
   */
  async update(id: InputId, patch: Partial<Input>): Promise<Input> {
    try {
      const current = await this.getById(id);
      if (!current) throw new NotFoundError("Input not found");

      const next: Input = Object.freeze({
        ...current,
        required: patch.required ?? current.required,
        position: patch.position ?? current.position,
        value: patch.value ?? current.value,
        // If the domain allows changing `type`, add: type: patch.type ?? current.type,
        updatedAt: nowIso(),
      });

      await this.ddb.put({
        TableName: this.tableName,
        Item: toDdbItem(inputItemMapper.toDTO(next)),
        ConditionExpression:
          "attribute_exists(pk) AND attribute_exists(sk)",
      });

      return next;
    } catch (err: any) {
      if (String(err?.name) === "ConditionalCheckFailedException") {
        throw new NotFoundError("Input not found");
      }
      throw mapAwsError(err, "InputRepositoryDdb.update");
    }
  }

  /**
   * Deletes an Input by composite id.
   * @param id Composite id `{ envelopeId, inputId }`.
   * @returns Resolves when the item is deleted.
   * @throws NotFoundError When the item does not exist.
   * @throws HttpError Normalized provider error via `mapAwsError`.
   */
  async delete(id: InputId): Promise<void> {
    try {
      await this.ddb.delete({
        TableName: this.tableName,
        Key: { pk: inputPk(id.envelopeId), sk: inputSk(id.inputId) },
        ConditionExpression:
          "attribute_exists(pk) AND attribute_exists(sk)",
      });
    } catch (err: any) {
      if (String(err?.name) === "ConditionalCheckFailedException") {
        throw new NotFoundError("Input not found");
      }
      throw mapAwsError(err, "InputRepositoryDdb.delete");
    }
  }
}
