/**
 * @file ConsentRepositoryDdb.ts
 * @summary DynamoDB-backed repository for the Consent aggregate
 * @description DynamoDB-backed repository for the Consent aggregate.
 * Single-table pattern (reusing the envelopes table):
 *   - PK = "ENVELOPE#<envelopeId>"
 *   - SK = "CONSENT#<consentId>"
 * Exposes low-level CRUD and a paginated list used by app-layer adapters.
 * Validates runtime shapes (Zod) and delegates mapping to mappers/.
 */

import {
  mapAwsError,
  nowIso,
  encodeCursor,   // opaque cursors (JsonValue)
  decodeCursor,   // opaque cursors (JsonValue)
  toJsonValue,    // safe coercion → JsonValue
} from "@lawprotect/shared-ts";
import type { DdbClientLike } from "@lawprotect/shared-ts";

import { dtoToConsentRow } from "./mappers/ConsentItemDTO.mapper";
import { CONSENT_TYPES, CONSENT_STATUSES } from "@/domain/values/enums";
import { badRequest } from "@/shared/errors";
import { validateConsentStatus } from "@/shared/validations/consent.validations";
import { ConflictError } from "@lawprotect/shared-ts";

import type {
  ConsentRepoRow,
  ConsentRepoKey,
  ConsentRepoCreateInput,
  ConsentRepoUpdateInput,
  ConsentRepoListInput,
  ConsentRepoListOutput,
} from "@/shared/types/consent";
import { ConsentItemDTO, ConsentItemDTOSchema } from "@/presentation/schemas/consents/ConsentItemDTO.schema";

const pk = (envelopeId: string) => `ENVELOPE#${envelopeId}`;
const sk = (consentId: string) => `CONSENT#${consentId}`;

/**
 * @description DynamoDB-backed repository for the Consent aggregate.
 * Provides CRUD operations and paginated listing for consent records.
 */
export class ConsentRepositoryDdb {
  /**
   * @description Creates a new ConsentRepositoryDdb instance.
   * @param {string} tableName - DynamoDB table name
   * @param {DdbClientLike} ddb - DynamoDB client instance
   */
  constructor(private readonly tableName: string, private readonly ddb: DdbClientLike) {}

  /**
   * @summary Creates a new consent record in DynamoDB
   * @description Creates a new consent record with validation of enum values and conflict checking.
   * Validates consent type and status against allowed enum values before creation.
   * 
   * @param {ConsentRepoCreateInput} input - Consent creation parameters
   * @returns {Promise<ConsentRepoRow>} Promise resolving to the created consent record
   * @throws {BadRequestError} When consent type or status is invalid
   * @throws {ConflictError} When consent already exists
   */
  async create(input: ConsentRepoCreateInput): Promise<ConsentRepoRow> {
    // Validate enum values
    if (!CONSENT_TYPES.includes(input.consentType as any)) {
      throw badRequest(`Invalid consent type: ${input.consentType}`, "INPUT_TYPE_NOT_ALLOWED", {
        validTypes: CONSENT_TYPES,
        providedType: input.consentType,
      });
    }
    
    if (!CONSENT_STATUSES.includes(input.status as any)) {
      throw badRequest(`Invalid consent status: ${input.status}`, "INPUT_TYPE_NOT_ALLOWED", {
        validStatuses: CONSENT_STATUSES,
        providedStatus: input.status,
      });
    }

    const now = input.createdAt ?? nowIso();
    const dto: ConsentItemDTO = {
      pk: pk(input.envelopeId),
      sk: sk(input.consentId),
      type: "Consent",
      envelopeId: input.envelopeId,
      tenantId: input.tenantId,
      consentId: input.consentId,
      partyId: input.partyId,
      consentType: input.consentType as typeof CONSENT_TYPES[number],
      status: validateConsentStatus(input.status) as typeof CONSENT_STATUSES[number],
      createdAt: now,
      updatedAt: now,
      expiresAt: input.expiresAt,
      metadata: input.metadata,
    };
    try {
      await this.ddb.put({
        TableName: this.tableName,
        Item: dto as any,
        ConditionExpression: "attribute_not_exists(pk) AND attribute_not_exists(sk)",
      });
      return dtoToConsentRow(dto);
    } catch (err: any) {
      if (String(err?.name) === "ConditionalCheckFailedException") {
        throw new ConflictError("Consent already exists");
      }
      throw mapAwsError(err, "ConsentRepositoryDdb.create");
    }
  }

  /**
   * @description Retrieves a consent record by its keys.
   * @param {ConsentRepoKey} keys - Consent identifier keys
   * @returns {Promise<ConsentRepoRow | null>} Promise resolving to consent record or null if not found
   */
  async getById(keys: ConsentRepoKey): Promise<ConsentRepoRow | null> {
    try {
      const out = await this.ddb.get({
        TableName: this.tableName,
        Key: { pk: pk(keys.envelopeId), sk: sk(keys.consentId) },
        ConsistentRead: true,
      });
      if (!out.Item) return null;
      const dto = ConsentItemDTOSchema.parse(out.Item);
      return dtoToConsentRow(dto);
    } catch (err: any) {
      throw mapAwsError(err, "ConsentRepositoryDdb.getById");
    }
  }

  /**
   * @summary Updates a consent record with the specified changes
   * @description Updates a consent record with validation of enum values if provided.
   * Automatically updates the updatedAt timestamp and validates status enum if included.
   * 
   * @param {ConsentRepoKey} keys - Consent identifier keys
   * @param {ConsentRepoUpdateInput} changes - Fields to update
   * @returns {Promise<ConsentRepoRow>} Promise resolving to the updated consent record
   * @throws {BadRequestError} When consent status is invalid
   */
  async update(keys: ConsentRepoKey, changes: ConsentRepoUpdateInput): Promise<ConsentRepoRow> {
    // Validate enum values if provided
    if (typeof changes.status !== "undefined" && !CONSENT_STATUSES.includes(changes.status as any)) {
      throw badRequest(`Invalid consent status: ${changes.status}`, "INPUT_TYPE_NOT_ALLOWED", {
        validStatuses: CONSENT_STATUSES,
        providedStatus: changes.status,
      });
    }

    try {
      if (!this.ddb.update) throw new Error("DDB client does not implement update()");

      const names: Record<string, string> = { "#updatedAt": "updatedAt" };
      const values: Record<string, unknown> = { ":now": nowIso() };
      const sets: string[] = ["#updatedAt = :now"];

      if (typeof changes.status !== "undefined") {
        names["#status"] = "status";
        values[":status"] = changes.status;
        sets.push("#status = :status");
      }
      if (typeof changes.expiresAt !== "undefined") {
        names["#expiresAt"] = "expiresAt";
        values[":expiresAt"] = changes.expiresAt;
        sets.push("#expiresAt = :expiresAt");
      }
      if (typeof changes.metadata !== "undefined") {
        names["#metadata"] = "metadata";
        values[":metadata"] = changes.metadata;
        sets.push("#metadata = :metadata");
      }

      const out = await this.ddb.update({
        TableName: this.tableName,
        Key: { pk: pk(keys.envelopeId), sk: sk(keys.consentId) },
        UpdateExpression: `SET ${sets.join(", ")}`,
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: values,
        ConditionExpression: "attribute_exists(pk) AND attribute_exists(sk)",
        ReturnValues: "ALL_NEW",
      });

      const dto = ConsentItemDTOSchema.parse(out.Attributes);
      return dtoToConsentRow(dto);
    } catch (err: any) {
      throw mapAwsError(err, "ConsentRepositoryDdb.update");
    }
  }

  /**
   * @summary Deletes a consent record from DynamoDB
   * @description Deletes a consent record with existence checking to ensure the record exists before deletion.
   * 
   * @param {ConsentRepoKey} keys - Consent identifier keys
   * @returns {Promise<void>} Promise that resolves when deletion is complete
   * @throws {NotFoundError} When consent record doesn't exist
   */
  async delete(keys: ConsentRepoKey): Promise<void> {
    try {
      await this.ddb.delete({
        TableName: this.tableName,
        Key: { pk: pk(keys.envelopeId), sk: sk(keys.consentId) },
        ConditionExpression: "attribute_exists(pk) AND attribute_exists(sk)",
      });
    } catch (err: any) {
      throw mapAwsError(err, "ConsentRepositoryDdb.delete");
    }
  }

  /**
   * @summary Lists consent records for a specific envelope with filtering and pagination
   * @description Queries consent records for a given envelope with optional filtering by status,
   * consent type, and party ID. Supports pagination with cursor-based navigation.
   * 
   * @param {ConsentRepoListInput} input - Query parameters including envelope ID and optional filters
   * @returns {Promise<ConsentRepoListOutput>} Promise resolving to paginated consent records
   */
  async listByEnvelope(input: ConsentRepoListInput): Promise<ConsentRepoListOutput> {
    try {
      const names: Record<string, string> = { "#sk": "sk" };
      const values: Record<string, unknown> = { ":pk": pk(input.envelopeId), ":skPrefix": "CONSENT#" };

      const filters: string[] = [];
      if (input.status)     { names["#status"] = "status";      values[":status"] = input.status;      filters.push("#status = :status"); }
      if (input.consentType){ names["#ctype"]  = "consentType"; values[":ctype"]  = input.consentType; filters.push("#ctype = :ctype"); }
      if (input.partyId)    { names["#party"]  = "partyId";     values[":party"]  = input.partyId;     filters.push("#party = :party"); }

      const out = await this.ddb.query?.({
        TableName: this.tableName,
        KeyConditionExpression: "pk = :pk AND begins_with(#sk, :skPrefix)",
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: values,
        FilterExpression: filters.length ? filters.join(" AND ") : undefined,
        Limit: Math.min(input.limit ?? 50, 100),
        ExclusiveStartKey: decodeCursor<Record<string, unknown>>(input.cursor),
        ScanIndexForward: true,
      });

      const items: ConsentRepoRow[] =
        (out?.Items ?? []).map(raw => dtoToConsentRow(ConsentItemDTOSchema.parse(raw)));

      const lek = out?.LastEvaluatedKey;
      const nextCursor = lek ? encodeCursor(toJsonValue(lek)) : undefined;

      return {
        items,
        meta: { limit: Math.min(input.limit ?? 50, 100), nextCursor, total: undefined },
      };
    } catch (err: any) {
      throw mapAwsError(err, "ConsentRepositoryDdb.listByEnvelope");
    }
  }
}
