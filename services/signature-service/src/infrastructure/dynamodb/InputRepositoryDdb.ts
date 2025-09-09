/**
 * @file InputRepositoryDdb.ts
 * @summary DynamoDB-backed repository for the `Input` entity.
 * @description
 * Single-table pattern:
 *   - PK = "ENVELOPE#<envelopeId>"
 *   - SK = "INPUT#<inputId>"
 * The repository is SDK-agnostic (uses `DdbClientLike`) and normalizes provider
 * errors via `mapAwsError`. Implements `InputsRepository`.
 */

import type { InputsRepository } from "../../domain/contracts/repositories/inputs/InputsRepository";
import { ConflictError, NotFoundError, mapAwsError, nowIso, requireQuery, BadRequestError } from "@lawprotect/shared-ts";
import type { DdbClientLike } from "@lawprotect/shared-ts";
import type { Input } from "../../domain/entities/Input";
import type { EnvelopeId } from "@/domain/value-objects/ids";
import type { InputKey } from "../../domain/types/infrastructure/dynamodb";
import {
  inputItemMapper,
  inputPk,
  inputSk,
} from "./mappers/inputItemMapper";
import { INPUT_VALUES } from "../../domain/values/enums";


/**
 * @description DynamoDB implementation of `InputsRepository`.
 */
export class InputRepositoryDdb implements InputsRepository {
  /**
   * @description Creates a repository instance.
   * @param {string} tableName DynamoDB table name.
   * @param {DdbClientLike} ddb Minimal DynamoDB client.
   */
  constructor(
    private readonly tableName: string,
    private readonly ddb: DdbClientLike
  ) {}

  /**
   * @description Loads an Input by its composite key.
   * @param {InputKey} inputKey The Input composite key.
   * @returns {Promise<Input | null>} The `Input` or `null` if not found.
   * @throws {HttpError} Normalized provider error via `mapAwsError`.
   */
  async getById(inputKey: InputKey): Promise<Input | null> {
    try {
      const res = await this.ddb.get({
        TableName: this.tableName,
        Key: { pk: inputPk(inputKey.envelopeId), sk: inputSk(inputKey.inputId) },
      });
      return res.Item ? inputItemMapper.fromDTO(res.Item as any) : null;
    } catch (err) {
      throw mapAwsError(err, "InputRepositoryDdb.getById");
    }
  }

  /**
   * @summary Adds a filter condition to the query parameters
   * @description Helper method to dynamically add filter conditions to DynamoDB query parameters.
   * Builds expression attribute names and values for filtering operations.
   * 
   * @param queryParams - DynamoDB query parameters object to modify
   * @param filterExpressions - Array of filter expressions to append to
   * @param fieldName - The actual field name in the database
   * @param value - The value to filter by
   * @param attributeName - The attribute name to use in the expression
   */
  private addFilterCondition(
    queryParams: any,
    filterExpressions: string[],
    fieldName: string,
    value: any,
    attributeName: string
  ): void {
    filterExpressions.push(`#${attributeName} = :${attributeName}`);
    if (!queryParams.ExpressionAttributeNames) {
      queryParams.ExpressionAttributeNames = {};
    }
    queryParams.ExpressionAttributeNames[`#${attributeName}`] = fieldName;
    queryParams.ExpressionAttributeValues[`:${attributeName}`] = value;
  }

  /**
   * @summary Builds filter expressions for the query
   * @description Helper method to build DynamoDB filter expressions based on provided parameters.
   * Supports filtering by documentId, partyId, input type, and required status.
   * 
   * @param queryParams - DynamoDB query parameters object to modify
   * @param params - Filter parameters object
   * @param params.documentId - Optional document ID to filter by
   * @param params.partyId - Optional party ID to filter by
   * @param params.type - Optional input type to filter by
   * @param params.required - Optional required status to filter by
   * @returns Array of filter expression strings
   */
  private buildFilterExpressions(
    queryParams: any,
    params: {
      documentId?: string;
      partyId?: string;
      type?: string;
      required?: boolean;
    }
  ): string[] {
    const filterExpressions: string[] = [];

    if (params.documentId) {
      this.addFilterCondition(queryParams, filterExpressions, "documentId", params.documentId, "documentId");
    }

    if (params.partyId) {
      this.addFilterCondition(queryParams, filterExpressions, "partyId", params.partyId, "partyId");
    }

    if (params.type) {
      this.addFilterCondition(queryParams, filterExpressions, "inputType", params.type, "inputType");
    }

    if (params.required !== undefined) {
      this.addFilterCondition(queryParams, filterExpressions, "required", params.required, "required");
    }

    return filterExpressions;
  }

  /**
   * @description Lists inputs by envelope with pagination support and optional filtering.
   * @param {object} params Query parameters including envelopeId, limit, cursor, and filters.
   * @returns {Promise<{items: Input[]; nextCursor?: string}>} Paginated list of inputs.
   * @throws {HttpError} Normalized provider error via `mapAwsError`.
   */
  async listByEnvelope(params: {
    envelopeId: EnvelopeId;
    limit?: number;
    cursor?: string;
    documentId?: string;
    partyId?: string;
    type?: string;
    required?: boolean;
  }): Promise<{ items: Input[]; nextCursor?: string }> {
    try {
      const limit = params.limit || 50;
      const queryParams: any = {
        TableName: this.tableName,
        KeyConditionExpression: "pk = :pk",
        ExpressionAttributeValues: {
          ":pk": inputPk(params.envelopeId),
        },
        Limit: limit,
      };

      // Build filter expressions
      const filterExpressions = this.buildFilterExpressions(queryParams, params);
      if (filterExpressions.length > 0) {
        queryParams.FilterExpression = filterExpressions.join(" AND ");
      }

      if (params.cursor) {
        queryParams.ExclusiveStartKey = JSON.parse(params.cursor);
      }

      requireQuery(this.ddb);
      const res = await this.ddb.query(queryParams);

      const items = (res.Items ?? []).map((item) => 
        inputItemMapper.fromDTO(item as any)
      );

      return {
        items,
        nextCursor: res.LastEvaluatedKey 
          ? JSON.stringify(res.LastEvaluatedKey) 
          : undefined,
      };
    } catch (err) {
      throw mapAwsError(err, "InputRepositoryDdb.listByEnvelope");
    }
  }

  /**
   * @description Checks whether an Input exists.
   * @param {InputKey} inputKey The Input composite key to check.
   * @returns {Promise<boolean>} `true` if the item exists; otherwise `false`.
   */
  async exists(inputKey: InputKey): Promise<boolean> {
    return (await this.getById(inputKey)) !== null;
  }

  /**
   * @description Creates a new Input. Fails if it already exists.
   * @param {Input} entity Domain entity to persist.
   * @returns {Promise<Input>} The persisted entity (same reference).
   * @throws {ConflictError} When the conditional write fails due to preexistence.
   * @throws {BadRequestError} When input type is invalid.
   * @throws {HttpError} Normalized provider error via `mapAwsError`.
   */
  async create(entity: Input): Promise<Input> {
    // Validate input type
    if (!INPUT_VALUES.includes(entity.type as typeof INPUT_VALUES[number])) {
      throw new BadRequestError(`Invalid input type: ${entity.type}`, "INPUT_TYPE_NOT_ALLOWED", {
        validTypes: INPUT_VALUES,
        providedType: entity.type,
      });
    }

    try {
      await this.ddb.put({
        TableName: this.tableName,
        Item: inputItemMapper.toDTO(entity) as Record<string, unknown>,
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
   * @description Partially updates an Input using read–modify–write.
   * Only whitelisted fields are updated; identifiers and `createdAt` remain immutable.
   * @param {InputKey} inputKey The Input composite key to update.
   * @param {Partial<Input>} patch Partial fields to apply.
   * @returns {Promise<Input>} The updated `Input`.
   * @throws {NotFoundError} When the item does not exist.
   * @throws {BadRequestError} When input type is invalid.
   * @throws {HttpError} Normalized provider error via `mapAwsError`.
   */
  async update(inputKey: InputKey, patch: Partial<Input>): Promise<Input> {
    try {
      const current = await this.getById(inputKey);
      if (!current) throw new NotFoundError("Input not found");

      // Validate input type if provided
      if (patch.type && !INPUT_VALUES.includes(patch.type as typeof INPUT_VALUES[number])) {
        throw new BadRequestError(`Invalid input type: ${patch.type}`, "INPUT_TYPE_NOT_ALLOWED", {
          validTypes: INPUT_VALUES,
          providedType: patch.type,
        });
      }

      const next: Input = Object.freeze({
        ...current,
        required: patch.required ?? current.required,
        position: patch.position ?? current.position,
        value: patch.value ?? current.value,
        type: patch.type ?? current.type,
        updatedAt: nowIso(),
      });

      await this.ddb.put({
        TableName: this.tableName,
        Item: inputItemMapper.toDTO(next) as Record<string, unknown>,
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
   * @description Deletes an Input by composite key.
   * @param {InputKey} inputKey The Input composite key to delete.
   * @returns {Promise<void>} Resolves when the item is deleted.
   * @throws {NotFoundError} When the item does not exist.
   * @throws {HttpError} Normalized provider error via `mapAwsError`.
   */
  async delete(inputKey: InputKey): Promise<void> {
    try {
      await this.ddb.delete({
        TableName: this.tableName,
        Key: { pk: inputPk(inputKey.envelopeId), sk: inputSk(inputKey.inputId) },
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



