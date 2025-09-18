/**
 * @fileoverview EnvelopeRepository - Repository for envelope data access
 * @summary Provides data access operations for envelope entities
 * @description This repository handles all database operations for envelopes
 * including CRUD operations, queries, and data persistence using DynamoDB.
 */

import type { Repository, DdbClientLike } from '@lawprotect/shared-ts';
import { 
  mapAwsError, 
  ConflictError, 
  ErrorCodes, 
  decodeCursor, 
  encodeCursor,
  NotFoundError 
} from '@lawprotect/shared-ts';

import { Envelope } from '../domain/entities/Envelope';
import type { EnvelopeId } from '../domain/value-objects/EnvelopeId';
import type { EnvelopeStatus } from '../domain/enums/EnvelopeStatus';
import { 
  requireQuery,
  type DdbClientWithQuery
} from '../domain/types/infrastructure/common/dynamodb-base';
import { 
  envelopeDdbMapper,
  createEnvelopeCursorPayload,
  type EnvelopeListResult,
  type EnvelopeCountResult,
  type EnvelopeListCursorPayload,
  EnvelopeKeyBuilders
} from '../domain/types/infrastructure/envelope';

/**
 * DynamoDB implementation of Repository<Envelope, EnvelopeId>.
 * Provides CRUD operations for envelope entities using DynamoDB single-table pattern.
 */
export class EnvelopeRepository implements Repository<Envelope, EnvelopeId, undefined> {
  private readonly indexName: string;
  private readonly gsi2IndexName: string;

  /**
   * Creates a new EnvelopeRepository instance.
   * @param tableName - DynamoDB table name
   * @param ddb - DynamoDB client instance
   * @param opts - Optional configuration
   * @param opts.indexName - GSI name for envelope queries (default: from env or "gsi1")
   * @param opts.gsi2IndexName - GSI2 name for owner queries (default: from env or "gsi2")
   */
  constructor(
    private readonly tableName: string,
    private readonly ddb: DdbClientLike,
    opts?: { indexName?: string; gsi2IndexName?: string }
  ) {
    this.indexName = opts?.indexName || process.env.ENVELOPES_GSI1_NAME || "gsi1";
    this.gsi2IndexName = opts?.gsi2IndexName || process.env.ENVELOPES_GSI2_NAME || "gsi2";
  }

  /**
   * Retrieves an envelope by its identifier.
   * @param envelopeId - The envelope identifier
   * @returns Promise resolving to envelope or null if not found
   * @throws AppError when DynamoDB operation fails
   */
  async getById(envelopeId: EnvelopeId): Promise<Envelope | null> {
    try {
      const res = await this.ddb.get({
        TableName: this.tableName,
        Key: { 
          pk: EnvelopeKeyBuilders.buildPk(envelopeId.getValue()), 
          sk: EnvelopeKeyBuilders.buildMetaSk() 
        }
      });
      // eslint-disable-next-line no-console
      console.log('DDB get Envelope', { id: envelopeId.getValue(), found: Boolean(res.Item) });
      if (!res.Item) return null;
      // eslint-disable-next-line no-console
      console.log('DDB get Envelope item keys', Object.keys(res.Item as any));
      try {
        return envelopeDdbMapper.fromDTO(res.Item as any);
      } catch (mapErr: any) {
        // eslint-disable-next-line no-console
        console.error('DDB get Envelope mapping error', { name: mapErr?.name, message: mapErr?.message, item: res.Item });
        throw mapErr;
      }
    } catch (err) {
      throw mapAwsError(err, "EnvelopeRepository.getById");
    }
  }

  /**
   * Checks if an envelope exists by its identifier.
   * @param envelopeId - The envelope identifier
   * @returns Promise resolving to true if envelope exists, false otherwise
   * @throws AppError when DynamoDB operation fails
   */
  async exists(envelopeId: EnvelopeId): Promise<boolean> {
    return (await this.getById(envelopeId)) !== null;
  }

  /**
   * Creates a new envelope in the database.
   * @param entity - The envelope entity to create
   * @returns Promise resolving to the created envelope
   * @throws ConflictError if envelope already exists
   * @throws AppError when DynamoDB operation fails
   */
  async create(entity: Envelope): Promise<Envelope> {
    try {
      // eslint-disable-next-line no-console
      console.log('DDB put Envelope start', { table: this.tableName, id: entity.getId().getValue() });
      await this.ddb.put({
        TableName: this.tableName,
        Item: envelopeDdbMapper.toDTO(entity) as any,
        ConditionExpression: "attribute_not_exists(pk) AND attribute_not_exists(sk)"
      });
      // eslint-disable-next-line no-console
      console.log('DDB put Envelope success', { id: entity.getId().getValue() });
      return entity;
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error('DDB put Envelope error', { name: err?.name, message: err?.message });
      if (String(err?.name) === "ConditionalCheckFailedException") {
        throw new ConflictError("Envelope already exists", ErrorCodes.COMMON_CONFLICT);
      }
      throw mapAwsError(err, "EnvelopeRepository.create");
    }
  }

  /**
   * Updates an existing envelope in the database.
   * @param envelopeId - The envelope identifier
   * @param patch - Partial envelope data to update
   * @returns Promise resolving to the updated envelope
   * @throws NotFoundError if envelope doesn't exist
   * @throws AppError when DynamoDB operation fails
   */
  async update(envelopeId: EnvelopeId, patch: Partial<Envelope>): Promise<Envelope> {
    try {
      const current = await this.getById(envelopeId);
      if (!current) {
        throw new NotFoundError(
          "Envelope not found",
          ErrorCodes.COMMON_NOT_FOUND,
          { envelopeId: envelopeId.getValue() }
        );
      }

      const plain = patch as any;
      const updated = new Envelope(
        current.getId(),
        (plain?.documentId) ?? current.getDocumentId(),
        (plain?.ownerId) ?? current.getOwnerId(),
        (plain?.status) ?? current.getStatus(),
        (plain?.signers) ?? current.getSigners(),
        (plain?.signingOrder) ?? current.getSigningOrder(),
        current.getCreatedAt(),
        new Date(),
        (plain?.metadata) ?? current.getMetadata(),
        (plain?.completedAt) ?? current.getCompletedAt()
      );

      await this.ddb.put({
        TableName: this.tableName,
        Item: envelopeDdbMapper.toDTO(updated) as any,
        ConditionExpression: "attribute_exists(pk) AND attribute_exists(sk)"
      });

      return updated;
    } catch (err: any) {
      if (String(err?.name) === "ConditionalCheckFailedException") {
        throw new NotFoundError(
          "Envelope not found",
          ErrorCodes.COMMON_NOT_FOUND,
          { envelopeId: envelopeId.getValue() }
        );
      }
      throw mapAwsError(err, "EnvelopeRepository.update");
    }
  }

  /**
   * Deletes an envelope from the database.
   * @param envelopeId - The envelope identifier
   * @returns Promise resolving when deletion is complete
   * @throws NotFoundError if envelope doesn't exist
   * @throws AppError when DynamoDB operation fails
   */
  async delete(envelopeId: EnvelopeId): Promise<void> {
    try {
      await this.ddb.delete({
        TableName: this.tableName,
        Key: { 
          pk: EnvelopeKeyBuilders.buildPk(envelopeId.getValue()), 
          sk: EnvelopeKeyBuilders.buildMetaSk() 
        },
        ConditionExpression: "attribute_exists(pk) AND attribute_exists(sk)"
      });
    } catch (err: any) {
      if (String(err?.name) === "ConditionalCheckFailedException") {
        throw new NotFoundError(
          "Envelope not found",
          ErrorCodes.COMMON_NOT_FOUND,
          { envelopeId: envelopeId.getValue() }
        );
      }
      throw mapAwsError(err, "EnvelopeRepository.delete");
    }
  }

  /**
   * Lists all envelopes with pagination.
   * @param params - Query parameters including limit and cursor
   * @returns Promise resolving to paginated envelope list
   * @throws AppError when DynamoDB operation fails
   */
  async listAll(params: { limit: number; cursor?: string }): Promise<EnvelopeListResult> {
    const take = Math.max(1, Math.min(params.limit ?? 25, 100)) + 1;
    const c = decodeCursor<EnvelopeListCursorPayload>(params.cursor);

    requireQuery(this.ddb);
    const ddb = this.ddb as DdbClientWithQuery;

    try {
      const exprNames: Record<string, string> = { "#gsi1pk": "gsi1pk" };
      if (c) {
        exprNames["#gsi1sk"] = "gsi1sk";
      }
      const res = await ddb.query({
        TableName: this.tableName,
        IndexName: this.indexName,
        KeyConditionExpression: "#gsi1pk = :envelope" + (c ? " AND #gsi1sk > :after" : ""),
        ExpressionAttributeNames: exprNames,
        ExpressionAttributeValues: {
          ":envelope": EnvelopeKeyBuilders.buildGsi1Pk(),
          ...(c ? { ":after": `${c.createdAt}#${c.envelopeId}` } : {}),
        },
        Limit: take,
        ScanIndexForward: true,
      });

      const rows = (res.Items ?? []) as any[];
      const mapped = rows
        .filter((it) => it.sk === "META")
        .map((it) => envelopeDdbMapper.fromDTO(it));

      const items = mapped.slice(0, take - 1);
      const hasMore = mapped.length === take;

      const last = items.at(-1);
      const nextCursor = hasMore && last
        ? encodeCursor(createEnvelopeCursorPayload(last) as any)
        : undefined;

      return { items, nextCursor };
    } catch (err) {
      throw mapAwsError(err, "EnvelopeRepository.listAll");
    }
  }

  /**
   * Lists envelopes by owner with pagination.
   * @param ownerId - The owner identifier
   * @param params - Query parameters including limit and cursor
   * @returns Promise resolving to paginated envelope list
   * @throws AppError when DynamoDB operation fails
   */
  async listByOwner(ownerId: string, params: { limit: number; cursor?: string }): Promise<EnvelopeListResult> {
    const take = Math.max(1, Math.min(params.limit ?? 25, 100)) + 1;
    const c = decodeCursor<EnvelopeListCursorPayload>(params.cursor);

    requireQuery(this.ddb);
    const ddb = this.ddb as DdbClientWithQuery;

    try {
      const exprNames: Record<string, string> = { "#gsi2pk": "gsi2pk" };
      if (c) {
        exprNames["#gsi2sk"] = "gsi2sk";
      }
      const res = await ddb.query({
        TableName: this.tableName,
        IndexName: this.gsi2IndexName,
        KeyConditionExpression: "#gsi2pk = :owner" + (c ? " AND #gsi2sk > :after" : ""),
        ExpressionAttributeNames: exprNames,
        ExpressionAttributeValues: {
          ":owner": EnvelopeKeyBuilders.buildGsi2Pk(ownerId),
          ...(c ? { ":after": `${c.createdAt}#${c.envelopeId}` } : {}),
        },
        Limit: take,
        ScanIndexForward: true,
      });

      const rows = (res.Items ?? []) as any[];

      // Hydrate full items when GSI projection is not ALL_ATTRIBUTES
      const hydrated: any[] = [];
      for (const it of rows) {
        let item: any | null = it;
        const hasAll = item && item.type === 'ENVELOPE' && item.sk === 'META' && item.envelopeId && item.metadata;
        if (!hasAll) {
          let envelopeIdFromIdx: string | undefined;
          if (item?.envelopeId) {
            envelopeIdFromIdx = item.envelopeId;
          } else if (item?.gsi2sk && typeof item.gsi2sk === 'string') {
            const parts = String(item.gsi2sk).split('#');
            envelopeIdFromIdx = parts[parts.length - 1];
          }
          if (envelopeIdFromIdx) {
            const full = await this.ddb.get({
              TableName: this.tableName,
              Key: { pk: EnvelopeKeyBuilders.buildPk(envelopeIdFromIdx), sk: EnvelopeKeyBuilders.buildMetaSk() },
              ConsistentRead: false
            });
            item = full.Item || null;
          } else {
            item = null;
          }
        }
        if (item && item.sk === 'META' && item.type === 'ENVELOPE') {
          hydrated.push(item);
        }
      }

      const mapped: Envelope[] = [];
      for (const it of hydrated) {
        try {
          mapped.push(envelopeDdbMapper.fromDTO(it));
        } catch {
          // Skip invalid/partial items
          continue;
        }
      }

      const items = mapped.slice(0, take - 1);
      const hasMore = mapped.length === take;

      const last = items.at(-1);
      const nextCursor = hasMore && last
        ? encodeCursor(createEnvelopeCursorPayload(last) as any)
        : undefined;

      return { items, nextCursor };
    } catch (err) {
      // Diagnostic logging (allowed): help surface DDB details in tests
      // eslint-disable-next-line no-console
      console.error('DDB listByOwner error', { ownerId, index: this.gsi2IndexName, error: (err as any)?.message });
      throw mapAwsError(err, "EnvelopeRepository.listByOwner");
    }
  }

  /**
   * Lists envelopes by status with pagination.
   * @param status - The envelope status
   * @param params - Query parameters including limit and cursor
   * @returns Promise resolving to paginated envelope list
   * @throws AppError when DynamoDB operation fails
   */
  async listByStatus(status: EnvelopeStatus, params: { limit: number; cursor?: string }): Promise<EnvelopeListResult> {
    const take = Math.max(1, Math.min(params.limit ?? 25, 100)) + 1;
    const c = decodeCursor<EnvelopeListCursorPayload>(params.cursor);

    requireQuery(this.ddb);
    const ddb = this.ddb as DdbClientWithQuery;

    try {
      const exprNames: Record<string, string> = { "#gsi2pk": "gsi2pk" };
      if (c) {
        exprNames["#gsi2sk"] = "gsi2sk";
      }
      const res = await ddb.query({
        TableName: this.tableName,
        IndexName: this.gsi2IndexName,
        KeyConditionExpression: "#gsi2pk = :status" + (c ? " AND #gsi2sk > :after" : ""),
        ExpressionAttributeNames: exprNames,
        ExpressionAttributeValues: {
          ":status": EnvelopeKeyBuilders.buildStatusGsi2Pk(status),
          ...(c ? { ":after": `${c.createdAt}#${c.envelopeId}` } : {}),
        },
        Limit: take,
        ScanIndexForward: true,
      });

      const rows = (res.Items ?? []) as any[];
      const mapped = rows
        .filter((it) => it.sk === "META")
        .map((it) => envelopeDdbMapper.fromDTO(it));

      const items = mapped.slice(0, take - 1);
      const hasMore = mapped.length === take;

      const last = items.at(-1);
      const nextCursor = hasMore && last
        ? encodeCursor(createEnvelopeCursorPayload(last) as any)
        : undefined;

      return { items, nextCursor };
    } catch (err) {
      throw mapAwsError(err, "EnvelopeRepository.listByStatus");
    }
  }

  /**
   * Lists envelopes by date range with pagination.
   * @param startDate - Start date for the range
   * @param endDate - End date for the range
   * @param params - Query parameters including limit and cursor
   * @returns Promise resolving to paginated envelope list
   * @throws AppError when DynamoDB operation fails
   */
  async listByDateRange(
    startDate: Date, 
    endDate: Date, 
    params: { limit: number; cursor?: string }
  ): Promise<EnvelopeListResult> {
    const take = Math.max(1, Math.min(params.limit ?? 25, 100)) + 1;

    requireQuery(this.ddb);
    const ddb = this.ddb as DdbClientWithQuery;

    try {
      const res = await ddb.query({
        TableName: this.tableName,
        IndexName: this.indexName,
        KeyConditionExpression: "#gsi1pk = :envelope AND #gsi1sk BETWEEN :start AND :end",
        ExpressionAttributeNames: {
          "#gsi1pk": "gsi1pk",
          "#gsi1sk": "gsi1sk",
        },
        ExpressionAttributeValues: {
          ":envelope": EnvelopeKeyBuilders.buildGsi1Pk(),
          ":start": startDate.toISOString(),
          ":end": endDate.toISOString(),
        },
        Limit: take,
        ScanIndexForward: true,
      });

      const rows = (res.Items ?? []) as any[];
      const mapped = rows
        .filter((it) => it.sk === "META")
        .map((it) => envelopeDdbMapper.fromDTO(it));

      const items = mapped.slice(0, take - 1);
      const hasMore = mapped.length === take;

      const last = items.at(-1);
      const nextCursor = hasMore && last
        ? encodeCursor(createEnvelopeCursorPayload(last) as any)
        : undefined;

      return { items, nextCursor };
    } catch (err) {
      throw mapAwsError(err, "EnvelopeRepository.listByDateRange");
    }
  }

  /**
   * Counts envelopes by status.
   * @param status - The envelope status to count
   * @returns Promise resolving to count result
   * @throws AppError when DynamoDB operation fails
   */
  async countByStatus(status: EnvelopeStatus): Promise<EnvelopeCountResult> {
    requireQuery(this.ddb);
    const ddb = this.ddb as DdbClientWithQuery;

    try {
      const res = await ddb.query({
        TableName: this.tableName,
        IndexName: this.gsi2IndexName,
        KeyConditionExpression: "#gsi2pk = :status",
        ExpressionAttributeNames: {
          "#gsi2pk": "gsi2pk",
        },
        ExpressionAttributeValues: {
          ":status": EnvelopeKeyBuilders.buildStatusGsi2Pk(status),
        },
      });

      return {
        count: (res as any).Count ?? 0,
        status
      };
    } catch (err) {
      throw mapAwsError(err, "EnvelopeRepository.countByStatus");
    }
  }

  /**
   * Counts envelopes by owner.
   * @param ownerId - The owner identifier
   * @returns Promise resolving to count result
   * @throws AppError when DynamoDB operation fails
   */
  async countByOwner(ownerId: string): Promise<EnvelopeCountResult> {
    requireQuery(this.ddb);
    const ddb = this.ddb as DdbClientWithQuery;

    try {
      const res = await ddb.query({
        TableName: this.tableName,
        IndexName: this.gsi2IndexName,
        KeyConditionExpression: "#gsi2pk = :owner",
        ExpressionAttributeNames: {
          "#gsi2pk": "gsi2pk",
        },
        ExpressionAttributeValues: {
          ":owner": EnvelopeKeyBuilders.buildGsi2Pk(ownerId),
        },
      });

      return {
        count: (res as any).Count ?? 0,
        ownerId
      };
    } catch (err) {
      throw mapAwsError(err, "EnvelopeRepository.countByOwner");
    }
  }
}