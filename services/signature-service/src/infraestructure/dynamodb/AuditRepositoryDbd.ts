// file: src/adapters/dynamodb/AuditRepositoryDdb.ts

/**
 * @file AuditRepositoryDdb.ts
 * @summary DynamoDB-backed implementation of the `AuditRepository` port.
 *
 * @description
 * Persists immutable audit events using a single-table layout and two GSIs:
 * - GSI#1 (by envelope): lists events for `(tenantId, envelopeId)` in ascending time order.
 * - GSI#2 (by id): fetches a single event by its identifier.
 *
 * The adapter:
 * - Uses `auditItemMapper` to translate between domain and persistence shapes.
 * - Encodes forward cursors as base64url JSON of the last evaluated sort key.
 * - Enforces append-only semantics with a conditional Put.
 * - Links events with a hash chain (`prevHash` → `hash`).
 */

import type { CursorPage, JsonObject, DdbClientLike } from "@lawprotect/shared-ts";
import {
  stableStringify,
  sha256Hex,
  mapAwsError,
  ConflictError,
  ErrorCodes,
  clamp,
  encodeCursor,
  decodeCursor,
  requireQuery,
  randomToken,
} from "@lawprotect/shared-ts";

import type { AuditRepository, ListByEnvelopeInput } from "@/domain/ports/Audit";
import type { AuditEvent } from "@/domain/value-objects/Audit";
import {
  auditItemMapper,
  auditItemFromRaw,
  auditPk,
  auditSk,
  gsi1Pk,
  gsi1Sk,
  gsi2Pk,
  type AuditItem,
} from "./mappers/AuditItemMapper";
import { toJsonObject } from "@/shared/utils";

export interface AuditRepositoryDdbProps {
  /** DynamoDB table name. */
  tableName: string;
  /** Minimal DDB client (from the container). */
  client: DdbClientLike;
  /** Optional index names. */
  indexes?: {
    byEnvelope?: string; // default "gsi1"
    byId?: string;       // default "gsi2"
  };
}

/** Default GSI names (override via `indexes`). */
const DEFAULT_IDX_ENV = "gsi1";
const DEFAULT_IDX_ID = "gsi2";

/**
 * DynamoDB implementation of the `AuditRepository` port.
 */
export class AuditRepositoryDdb implements AuditRepository {
  private readonly idxByEnvelope: string;
  private readonly idxById: string;

  constructor(private readonly props: AuditRepositoryDdbProps) {
    this.idxByEnvelope = props.indexes?.byEnvelope ?? DEFAULT_IDX_ENV;
    this.idxById = props.indexes?.byId ?? DEFAULT_IDX_ID;
  }

  /**
   * Fetches a single audit event by id using the ID GSI.
   *
   * @param id Audit event identifier.
   * @returns The event or `null` when not found.
   * @throws Errors mapped via `mapAwsError`.
   */
  async getById(id: AuditEvent["id"]): Promise<AuditEvent | null> {
    try {
      requireQuery(this.props.client);
      const res = await this.props.client.query({
        TableName: this.props.tableName,
        IndexName: this.idxById,
        KeyConditionExpression: "#pk = :pk",
        ExpressionAttributeNames: { "#pk": "gsi2pk" },
        ExpressionAttributeValues: { ":pk": gsi2Pk(String(id)) },
        Limit: 1,
      });

      const raw = res.Items?.[0] as Record<string, unknown> | undefined;
      return raw ? auditItemFromRaw(raw) : null;
    } catch (err) {
      throw mapAwsError(err, "AuditRepositoryDdb.getById");
    }
  }

  /**
   * Lists audit events for `(tenantId, envelopeId)` with forward-only cursor pagination.
   * Results are ordered by `occurredAt` ascending (stable by `id` as tiebreaker).
   *
   * @param input Scope and pagination hints.
   * @returns A page of events and `meta` including the echoed `limit` and optional `nextCursor`.
   * @throws Errors mapped via `mapAwsError`.
   */
  async listByEnvelope(input: ListByEnvelopeInput): Promise<CursorPage<AuditEvent>> {
    const limit = clamp(input.limit, 1, 100);
    const afterSk = decodeCursor<{ sk: string }>(input.cursor)?.sk;

    try {
      requireQuery(this.props.client);
      const res = await this.props.client.query({
        TableName: this.props.tableName,
        IndexName: this.idxByEnvelope,
        KeyConditionExpression: "#pk = :pk" + (afterSk ? " AND #sk > :after" : ""),
        ExpressionAttributeNames: { "#pk": "gsi1pk", "#sk": "gsi1sk" },
        ExpressionAttributeValues: {
          ":pk": gsi1Pk(String(input.tenantId), String(input.envelopeId)),
          ...(afterSk ? { ":after": afterSk } : {}),
        },
        Limit: limit + 1,            // lookahead to detect continuation
        ScanIndexForward: true,      // ASC by occurredAt
      });

      const rawRows = (res.Items ?? []) as Array<Record<string, unknown>>;
      const items = rawRows.slice(0, limit).map((it) => auditItemFromRaw(it));

      const hasMore = rawRows.length > limit;
      const lastIdx = hasMore ? limit - 1 : rawRows.length - 1;
      const lastSk = lastIdx >= 0 ? (rawRows[lastIdx] as any)?.gsi1sk : undefined;
      const nextCursor = hasMore && typeof lastSk === "string" ? encodeCursor({ sk: lastSk }) : undefined;

      return {
        items,
        meta: nextCursor ? { limit, nextCursor } : { limit },
      };
    } catch (err) {
      throw mapAwsError(err, "AuditRepositoryDdb.listByEnvelope");
    }
  }

  /**
   * Appends a new immutable audit event and computes a hash link.
   *
   * @param candidate Event payload without `id` and `hash`.
   * @returns Persisted event with assigned `id` and computed `hash`.
   * @throws `ConflictError` when an item with the same PK/SK already exists.
   * @throws Errors mapped via `mapAwsError`.
   */
  async record(candidate: Omit<AuditEvent, "id" | "hash"> & { hash?: string }): Promise<AuditEvent> {
    try {
      const id = randomToken(16); // 16 bytes → ~22 char base64url

      const prevHash =
        (candidate as any).prevHash ??
        (await this.getLatestHash(String(candidate.tenantId), String(candidate.envelopeId)));

      const payloadForHash: JsonObject = toJsonObject({
        id,
        tenantId: String(candidate.tenantId),
        envelopeId: String(candidate.envelopeId),
        type: candidate.type,
        occurredAt: candidate.occurredAt,
        actor: candidate.actor ? toJsonObject(candidate.actor as Record<string, unknown>) : undefined,
        metadata: candidate.metadata ? toJsonObject(candidate.metadata as Record<string, unknown>) : undefined,
        prevHash,
      });

      const hash = candidate.hash ?? sha256Hex(stableStringify(payloadForHash));

      const item: AuditItem = {
        // table keys
        pk: auditPk(String(candidate.tenantId)),
        sk: auditSk(String(candidate.envelopeId), candidate.occurredAt, id),
        type: "AuditEvent",

        // payload
        id,
        tenantId: String(candidate.tenantId),
        envelopeId: String(candidate.envelopeId),
        occurredAt: candidate.occurredAt,
        eventType: candidate.type,
        actor: candidate.actor ? toJsonObject(candidate.actor as Record<string, unknown>) : undefined,
        metadata: candidate.metadata ? toJsonObject(candidate.metadata as Record<string, unknown>) : undefined,
        prevHash: prevHash ?? undefined,
        hash,

        // GSIs
        gsi1pk: gsi1Pk(String(candidate.tenantId), String(candidate.envelopeId)),
        gsi1sk: gsi1Sk(candidate.occurredAt, id),
        gsi2pk: gsi2Pk(id),
      };

      await this.props.client.put({
        TableName: this.props.tableName,
        Item: item as unknown as Record<string, unknown>,
        ConditionExpression: "attribute_not_exists(pk) AND attribute_not_exists(sk)",
      });

      return auditItemMapper.fromDTO(item);
    } catch (err: any) {
      if (String(err?.name) === "ConditionalCheckFailedException") {
        throw new ConflictError("Audit event already exists", ErrorCodes.COMMON_CONFLICT);
      }
      throw mapAwsError(err, "AuditRepositoryDdb.record");
    }
  }

  /**
   * Retrieves the latest `hash` for a `(tenantId, envelopeId)` pair, if any.
   *
   * @param tenantId Tenant identifier.
   * @param envelopeId Envelope identifier.
   * @returns The latest hash or `undefined` when no prior events exist.
   */
  private async getLatestHash(tenantId: string, envelopeId: string): Promise<string | undefined> {
    requireQuery(this.props.client);
    const res = await this.props.client.query({
      TableName: this.props.tableName,
      IndexName: this.idxByEnvelope,
      KeyConditionExpression: "#pk = :pk",
      ExpressionAttributeNames: { "#pk": "gsi1pk" },
      ExpressionAttributeValues: { ":pk": gsi1Pk(tenantId, envelopeId) },
      Limit: 1,
      ScanIndexForward: false, // DESC → newest first
    });

    const latest = res.Items?.[0] as Record<string, unknown> | undefined;
    const h = (latest as any)?.hash;
    return typeof h === "string" && h.length > 0 ? h : undefined;
  }
}
