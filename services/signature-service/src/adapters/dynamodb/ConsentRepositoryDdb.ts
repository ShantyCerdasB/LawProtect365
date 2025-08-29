/**
 * @file ConsentRepositoryDdb.ts
 * @summary DynamoDB-backed repository for the Consent aggregate.
 *
 * Single-table pattern (reusing the envelopes table):
 *   - PK = "ENVELOPE#<envelopeId>"
 *   - SK = "CONSENT#<consentId>"
 *
 * Exposes low-level CRUD and a paginated list used by app-layer adapters.
 * Validates runtime shapes (Zod) and delegates mapping to mappers/.
 */

import {
  mapAwsError,
  ConflictError,
  nowIso,
  encodeCursor,   // opaque cursors (JsonValue)
  decodeCursor,   // opaque cursors (JsonValue)
  toJsonValue,    // safe coercion → JsonValue
} from "@lawprotect/shared-ts";
import type { DdbClientLike } from "@lawprotect/shared-ts";

import {
  ConsentItemDTOSchema,
  type ConsentItemDTO,
} from "./schemas/ConsentItemDTO.schema";
import { dtoToConsentRow } from "./mappers/ConsentItemDTO.mapper";

import type {
  ConsentRepoRow,
  ConsentRepoKey,
  ConsentRepoCreateInput,
  ConsentRepoUpdateInput,
  ConsentRepoListInput,
  ConsentRepoListOutput,
} from "@/adapters/shared/RepoTypes";

const pk = (envelopeId: string) => `ENVELOPE#${envelopeId}`;
const sk = (consentId: string) => `CONSENT#${consentId}`;

export class ConsentRepositoryDdb {
  constructor(private readonly tableName: string, private readonly ddb: DdbClientLike) {}

  async create(input: ConsentRepoCreateInput): Promise<ConsentRepoRow> {
    const now = input.createdAt ?? nowIso();
    const dto: ConsentItemDTO = {
      pk: pk(input.envelopeId),
      sk: sk(input.consentId),
      type: "Consent",
      envelopeId: input.envelopeId,
      consentId: input.consentId,
      partyId: input.partyId,
      consentType: input.consentType,
      status: input.status,
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

  async update(keys: ConsentRepoKey, changes: ConsentRepoUpdateInput): Promise<ConsentRepoRow> {
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
