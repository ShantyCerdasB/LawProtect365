/**
 * @fileoverview EnvelopeRepository - Repository for envelope data access
 * @summary Provides data access operations for envelope entities
 * @description This repository handles all database operations for envelopes
 * including CRUD operations, queries, and data persistence using DynamoDB.
 */

import type { Repository, DdbClientLike, DdbClientWithQuery } from '@lawprotect/shared-ts';
import { 
  mapAwsError, 
  ConflictError, 
  ErrorCodes, 
  decodeCursor, 
  encodeCursor,
  NotFoundError,
  requireQuery
} from '@lawprotect/shared-ts';

import { Envelope } from '../domain/entities/Envelope';
import type { EnvelopeId } from '../domain/value-objects/EnvelopeId';
import type { EnvelopeStatus } from '../domain/enums/EnvelopeStatus';
import { 
  envelopeDdbMapper,
  createEnvelopeCursorPayload,
  type EnvelopeListResult,
  type EnvelopeCountResult,
  type EnvelopeListCursorPayload,
  type EnvelopeDdbItem,
  EnvelopeKeyBuilders
} from '../domain/types/infrastructure/envelope';
import { BaseRepository } from './BaseRepository';
import { DdbSortOrder } from '../domain/types/infrastructure/common';

/**
 * Type guard for envelope DDB items
 */
function isEnvelopeDdbItem(item: any): item is EnvelopeDdbItem {
  return item && item.sk === "META" && item.type === "ENVELOPE";
}

/**
 * DynamoDB implementation of Repository<Envelope, EnvelopeId>.
 * Provides CRUD operations for envelope entities using DynamoDB single-table pattern.
 */
export class EnvelopeRepository extends BaseRepository implements Repository<Envelope, EnvelopeId, undefined> {
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
    tableName: string,
    ddb: DdbClientLike,
    opts?: { indexName?: string; gsi2IndexName?: string }
  ) {
    super(tableName, ddb);
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
      if (!res.Item) return null;
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
      await this.ddb.put({
        TableName: this.tableName,
        Item: envelopeDdbMapper.toDTO(entity) as any,
        ConditionExpression: "attribute_not_exists(pk) AND attribute_not_exists(sk)"
      });
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
    const cursor = params.cursor ? decodeCursor<EnvelopeListCursorPayload>(params.cursor) : undefined;

    const result = await this.executeAdvancedPaginatedQuery(
      {
        tableName: this.tableName,
        indexName: this.indexName,
        keyConditionExpression: "#gsi1pk = :envelope" + (cursor ? " AND #gsi1sk > :after" : ""),
        expressionAttributeNames: {
          "#gsi1pk": "gsi1pk",
          ...(cursor ? { "#gsi1sk": "gsi1sk" } : {})
        },
        expressionAttributeValues: {
          ":envelope": EnvelopeKeyBuilders.buildGsi1Pk(),
          ...(cursor ? { ":after": `${cursor.createdAt}#${cursor.envelopeId}` } : {})
        },
        cursor,
        limit: params.limit ?? 25,
        sortOrder: DdbSortOrder.ASC,
        ddb: this.ddb,
        exclusiveStartKeyBuilder: cursor ? (c) => ({
          pk: EnvelopeKeyBuilders.buildPk(c.envelopeId),
          sk: EnvelopeKeyBuilders.buildMetaSk(),
          gsi1pk: EnvelopeKeyBuilders.buildGsi1Pk(),
          gsi1sk: `${c.createdAt}#${c.envelopeId}`
        }) : undefined
      },
      isEnvelopeDdbItem,
      envelopeDdbMapper,
      (envelope) => ({
        createdAt: envelope.getCreatedAt().toISOString(),
        envelopeId: envelope.getId().getValue()
      }),
      'EnvelopeRepository.listAll'
    );

    return {
      items: result.items,
      nextCursor: result.nextCursor
    };
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
      const queryParams = this.buildQueryParams(ownerId, c || null, take);
      const res = await ddb.query(queryParams);
      const rows = (res.Items ?? []) as any[];

      const hydrated = await this.hydrateItems(rows);
      const mapped = this.mapToEnvelopes(hydrated);
      const result = this.buildPaginationResult(mapped, take);

      return result;
    } catch (err) {
      // Diagnostic logging (allowed): help surface DDB details in tests
      // eslint-disable-next-line no-console
      console.error('DDB listByOwner error', { ownerId, index: this.gsi2IndexName, error: (err as any)?.message });
      throw mapAwsError(err, "EnvelopeRepository.listByOwner");
    }
  }

  /**
   * Builds query parameters for DynamoDB query
   */
  private buildQueryParams(ownerId: string, cursor: EnvelopeListCursorPayload | null, take: number) {
    const exprNames: Record<string, string> = { "#gsi2pk": "gsi2pk" };
    if (cursor) {
      exprNames["#gsi2sk"] = "gsi2sk";
    }

    return {
      TableName: this.tableName,
      IndexName: this.gsi2IndexName,
      KeyConditionExpression: "#gsi2pk = :owner" + (cursor ? " AND #gsi2sk > :after" : ""),
      ExpressionAttributeNames: exprNames,
      ExpressionAttributeValues: {
        ":owner": EnvelopeKeyBuilders.buildGsi2Pk(ownerId),
        ...(cursor ? { ":after": `${cursor.createdAt}#${cursor.envelopeId}` } : {}),
      },
      Limit: take,
      ScanIndexForward: true,
    };
  }

  /**
   * Hydrates items when GSI projection is not ALL_ATTRIBUTES
   */
  private async hydrateItems(rows: any[]): Promise<any[]> {
    const hydrated: any[] = [];
    
    for (const it of rows) {
      let item: any = it;
      const hasAll = item && item.type === 'ENVELOPE' && item.sk === 'META' && item.envelopeId && item.metadata;
      
      if (!hasAll) {
        item = await this.hydratePartialItem(item);
      }
      
      if (item && item.sk === 'META' && item.type === 'ENVELOPE') {
        hydrated.push(item);
      }
    }
    
    return hydrated;
  }

  /**
   * Hydrates a partial item by fetching full data
   */
  private async hydratePartialItem(item: any): Promise<any> {
    const envelopeIdFromIdx = this.extractEnvelopeId(item);
    
    if (!envelopeIdFromIdx) {
      return null;
    }

    const full = await this.ddb.get({
      TableName: this.tableName,
      Key: { pk: EnvelopeKeyBuilders.buildPk(envelopeIdFromIdx), sk: EnvelopeKeyBuilders.buildMetaSk() },
      ConsistentRead: false
    });
    
    return full.Item || null;
  }

  /**
   * Extracts envelope ID from item
   */
  private extractEnvelopeId(item: any): string | undefined {
    if (item?.envelopeId) {
      return item.envelopeId;
    }
    
    if (item?.gsi2sk && typeof item.gsi2sk === 'string') {
      const parts = String(item.gsi2sk).split('#');
      return parts[parts.length - 1];
    }
    
    return undefined;
  }

  /**
   * Maps hydrated items to Envelope entities
   */
  private mapToEnvelopes(hydrated: any[]): Envelope[] {
    const mapped: Envelope[] = [];
    
    for (const it of hydrated) {
      try {
        mapped.push(envelopeDdbMapper.fromDTO(it));
      } catch {
        // Skip invalid/partial items
        continue;
      }
    }
    
    return mapped;
  }

  /**
   * Builds pagination result
   */
  private buildPaginationResult(mapped: Envelope[], take: number): EnvelopeListResult {
    const items = mapped.slice(0, take - 1);
    const hasMore = mapped.length === take;

    const last = items.at(-1);
    const nextCursor = hasMore && last
      ? encodeCursor(createEnvelopeCursorPayload(last) as any)
      : undefined;

    return { items, nextCursor };
  }

  /**
   * Lists envelopes by status with pagination.
   * @param status - The envelope status
   * @param params - Query parameters including limit and cursor
   * @returns Promise resolving to paginated envelope list
   * @throws AppError when DynamoDB operation fails
   */
  async listByStatus(status: EnvelopeStatus, params: { limit: number; cursor?: string }): Promise<EnvelopeListResult> {
    const cursor = params.cursor ? decodeCursor<EnvelopeListCursorPayload>(params.cursor) : undefined;

    const result = await this.executeAdvancedPaginatedQuery(
      {
        tableName: this.tableName,
        indexName: this.gsi2IndexName,
        keyConditionExpression: "#gsi2pk = :status" + (cursor ? " AND #gsi2sk > :after" : ""),
        expressionAttributeNames: {
          "#gsi2pk": "gsi2pk",
          ...(cursor ? { "#gsi2sk": "gsi2sk" } : {})
        },
        expressionAttributeValues: {
          ":status": EnvelopeKeyBuilders.buildStatusGsi2Pk(status),
          ...(cursor ? { ":after": `${cursor.createdAt}#${cursor.envelopeId}` } : {})
        },
        cursor,
        limit: params.limit ?? 25,
        sortOrder: DdbSortOrder.ASC,
        ddb: this.ddb,
        exclusiveStartKeyBuilder: cursor ? (c) => ({
          pk: EnvelopeKeyBuilders.buildPk(c.envelopeId),
          sk: EnvelopeKeyBuilders.buildMetaSk(),
          gsi2pk: EnvelopeKeyBuilders.buildStatusGsi2Pk(status),
          gsi2sk: `${c.createdAt}#${c.envelopeId}`
        }) : undefined
      },
      isEnvelopeDdbItem,
      envelopeDdbMapper,
      (envelope) => ({
        createdAt: envelope.getCreatedAt().toISOString(),
        envelopeId: envelope.getId().getValue()
      }),
      'EnvelopeRepository.listByStatus'
    );

    return {
      items: result.items,
      nextCursor: result.nextCursor
    };
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
    const cursor = params.cursor ? decodeCursor<EnvelopeListCursorPayload>(params.cursor) : undefined;

    const result = await this.executeAdvancedPaginatedQuery(
      {
        tableName: this.tableName,
        indexName: this.indexName,
        keyConditionExpression: "#gsi1pk = :envelope AND #gsi1sk BETWEEN :start AND :end",
        expressionAttributeNames: {
          "#gsi1pk": "gsi1pk",
          "#gsi1sk": "gsi1sk"
        },
        expressionAttributeValues: {
          ":envelope": EnvelopeKeyBuilders.buildGsi1Pk(),
          ":start": startDate.toISOString(),
          ":end": endDate.toISOString()
        },
        cursor,
        limit: params.limit ?? 25,
        sortOrder: DdbSortOrder.ASC,
        ddb: this.ddb,
        exclusiveStartKeyBuilder: cursor ? (c) => ({
          pk: EnvelopeKeyBuilders.buildPk(c.envelopeId),
          sk: EnvelopeKeyBuilders.buildMetaSk(),
          gsi1pk: EnvelopeKeyBuilders.buildGsi1Pk(),
          gsi1sk: `${c.createdAt}#${c.envelopeId}`
        }) : undefined
      },
      isEnvelopeDdbItem,
      envelopeDdbMapper,
      (envelope) => ({
        createdAt: envelope.getCreatedAt().toISOString(),
        envelopeId: envelope.getId().getValue()
      }),
      'EnvelopeRepository.listByDateRange'
    );

    return {
      items: result.items,
      nextCursor: result.nextCursor
    };
  }

  /**
   * Counts envelopes by status.
   * @param status - The envelope status to count
   * @returns Promise resolving to count result
   * @throws AppError when DynamoDB operation fails
   */
  async countByStatus(status: EnvelopeStatus): Promise<EnvelopeCountResult> {
    const count = await this.executeCountQuery(
      this.tableName,
      this.gsi2IndexName,
      'gsi2pk',
      EnvelopeKeyBuilders.buildStatusGsi2Pk(status),
      this.ddb,
      'EnvelopeRepository.countByStatus'
    );

    return {
      count,
      status
    };
  }

  /**
   * Counts envelopes by owner.
   * @param ownerId - The owner identifier
   * @returns Promise resolving to count result
   * @throws AppError when DynamoDB operation fails
   */
  async countByOwner(ownerId: string): Promise<EnvelopeCountResult> {
    const count = await this.executeCountQuery(
      this.tableName,
      this.gsi2IndexName,
      'gsi2pk',
      EnvelopeKeyBuilders.buildGsi2Pk(ownerId),
      this.ddb,
      'EnvelopeRepository.countByOwner'
    );

    return {
      count,
      ownerId
    };
  }
}