/**
 * @fileoverview AuditRepository - Repository for audit event data access
 * @summary Provides data access operations for audit events
 * @description This repository handles all database operations for audit events
 * including CRUD operations, queries, and data persistence.
 */

import { DdbClientLike, mapAwsError, ConflictError, ErrorCodes, decodeCursor, encodeCursor, NotFoundError, BadRequestError, requireQuery } from '@lawprotect/shared-ts';

import { AuditEvent } from '../domain/types/audit/AuditEvent';
import { CreateAuditEventRequest } from '../domain/types/audit/CreateAuditEventRequest';
import { AuditEventType } from '../domain/enums/AuditEventType';
import {
  auditItemMapper,
  createAuditEventFromRequest,
  isAuditDdbItem,
  AuditKeyBuilders,
  type AuditListResult,
  type AuditListCursorPayload
} from '../domain/types/infrastructure/audit';
import { DdbSortOrder } from '../domain/types/infrastructure/common';

/**
 * AuditRepository implementation for DynamoDB
 * 
 * Provides CRUD operations and querying capabilities for audit events
 * using single-table pattern with multiple GSI for efficient querying.
 */
export class AuditRepository {
  private readonly envelopeGsi1Name: string;
  private readonly signerGsi2Name: string;
  private readonly userGsi3Name: string;
  private readonly typeGsi4Name: string;

  /**
   * Creates a new AuditRepository instance
   * @param tableName - DynamoDB table name
   * @param ddb - DynamoDB client instance
   * @param options - Optional configuration for GSI names
   */
  constructor(
    private readonly tableName: string,
    private readonly ddb: DdbClientLike,
    options?: {
      readonly envelopeGsi1Name?: string;
      readonly signerGsi2Name?: string;
      readonly userGsi3Name?: string;
      readonly typeGsi4Name?: string;
    }
  ) {
    this.envelopeGsi1Name = options?.envelopeGsi1Name || 'gsi1';
    this.signerGsi2Name = options?.signerGsi2Name || 'gsi2';
    this.userGsi3Name = options?.userGsi3Name || 'gsi3';
    this.typeGsi4Name = options?.typeGsi4Name || 'gsi4';
  }

  /**
   * Creates a new audit event
   * @param request - The create audit event request
   * @returns The created audit event
   * @throws {ConflictError} When audit event already exists
   */
  async create(request: CreateAuditEventRequest): Promise<AuditEvent> {
    const auditEvent = createAuditEventFromRequest(request);
    const item = auditItemMapper.toDTO(auditEvent);

    try {
      // eslint-disable-next-line no-console
      console.log('DDB put Audit item', { keys: Object.keys(item), eventType: item.eventType, envelopeId: item.envelopeId });
      await this.ddb.put({
        TableName: this.tableName,
        Item: item as any,
        ConditionExpression: 'attribute_not_exists(pk) AND attribute_not_exists(sk)'
      });

      return auditEvent;
    } catch (err: any) {
      if (err.name === 'ConditionalCheckFailedException') {
        throw new ConflictError(
          'Audit event already exists',
          ErrorCodes.COMMON_CONFLICT,
          { auditEventId: auditEvent.id }
        );
      }
      throw mapAwsError(err, 'AuditRepository.create');
    }
  }

  /**
   * Retrieves an audit event by ID
   * @param id - The audit event ID
   * @returns The audit event or null if not found
   */
  async getById(id: string): Promise<AuditEvent | null> {
    try {
      const res = await this.ddb.get({
        TableName: this.tableName,
        Key: {
          pk: AuditKeyBuilders.buildPk(id),
          sk: AuditKeyBuilders.buildMetaSk()
        }
      });

      if (!res.Item) {
        return null;
      }

      if (!isAuditDdbItem(res.Item)) {
        throw new BadRequestError('Invalid audit event data structure', 'INVALID_AUDIT_EVENT_DATA');
      }

      return auditItemMapper.fromDTO(res.Item);
    } catch (err: any) {
      throw mapAwsError(err, 'AuditRepository.getById');
    }
  }

  /**
   * Updates an audit event
   * @param id - The audit event ID
   * @param patch - The partial audit event data to update
   * @returns The updated audit event
   * @throws {NotFoundError} When audit event is not found
   */
  async update(id: string, patch: Partial<AuditEvent>): Promise<AuditEvent> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new NotFoundError(
        'Audit event not found',
        ErrorCodes.COMMON_NOT_FOUND,
        { auditEventId: id }
      );
    }

    const updatedEvent: AuditEvent = {
      ...existing,
      ...patch,
      id: existing.id // Ensure ID cannot be changed
    };

    const item = auditItemMapper.toDTO(updatedEvent);

    try {
      await this.ddb.put({
        TableName: this.tableName,
        Item: item as any,
        ConditionExpression: 'attribute_exists(pk) AND attribute_exists(sk)'
      });

      return updatedEvent;
    } catch (err: any) {
      if (err.name === 'ConditionalCheckFailedException') {
        throw new NotFoundError(
          'Audit event not found',
          ErrorCodes.COMMON_NOT_FOUND,
          { auditEventId: id }
        );
      }
      throw mapAwsError(err, 'AuditRepository.update');
    }
  }

  /**
   * Deletes an audit event
   * @param id - The audit event ID
   * @throws {NotFoundError} When audit event is not found
   */
  async delete(id: string): Promise<void> {
    try {
      await this.ddb.delete({
        TableName: this.tableName,
        Key: {
          pk: AuditKeyBuilders.buildPk(id),
          sk: AuditKeyBuilders.buildMetaSk()
        },
        ConditionExpression: 'attribute_exists(pk) AND attribute_exists(sk)'
      });
    } catch (err: any) {
      if (err.name === 'ConditionalCheckFailedException') {
        throw new NotFoundError(
          'Audit event not found',
          ErrorCodes.COMMON_NOT_FOUND,
          { auditEventId: id }
        );
      }
      throw mapAwsError(err, 'AuditRepository.delete');
    }
  }

  /**
   * Checks if an audit event exists
   * @param id - The audit event ID
   * @returns True if the audit event exists
   */
  async exists(id: string): Promise<boolean> {
    try {
      const res = await this.ddb.get({
        TableName: this.tableName,
        Key: {
          pk: AuditKeyBuilders.buildPk(id),
          sk: AuditKeyBuilders.buildMetaSk()
        }
      });

      return !!res.Item;
    } catch (err: any) {
      throw mapAwsError(err, 'AuditRepository.exists');
    }
  }

  /**
   * Lists audit events by envelope ID
   * @param envelopeId - The envelope ID
   * @param limit - Maximum number of items to return
   * @param cursor - Pagination cursor
   * @param sortOrder - Sort order for results
   * @returns List of audit events with pagination info
   */
  async listByEnvelope(
    envelopeId: string,
    limit: number = 25,
    cursor?: string,
    sortOrder: DdbSortOrder = DdbSortOrder.DESC
  ): Promise<AuditListResult> {
    // eslint-disable-next-line no-console
    console.log('DDB query AuditByEnvelope', {
      index: this.envelopeGsi1Name,
      gsiPk: AuditKeyBuilders.buildEnvelopeGsi1Pk(envelopeId)
    });
    const res = await this.listByGsi(
      this.envelopeGsi1Name,
      AuditKeyBuilders.buildEnvelopeGsi1Pk(envelopeId),
      limit,
      cursor,
      sortOrder
    );
    // eslint-disable-next-line no-console
    console.log('DDB AuditByEnvelope result', { count: res.items.length, hasNext: res.hasNext });
    return res;
  }

  /**
   * Lists audit events by signer ID
   * @param signerId - The signer ID
   * @param limit - Maximum number of items to return
   * @param cursor - Pagination cursor
   * @param sortOrder - Sort order for results
   * @returns List of audit events with pagination info
   */
  async listBySigner(
    signerId: string,
    limit: number = 25,
    cursor?: string,
    sortOrder: DdbSortOrder = DdbSortOrder.DESC
  ): Promise<AuditListResult> {
    return this.listByGsi(
      this.signerGsi2Name,
      AuditKeyBuilders.buildSignerGsi2Pk(signerId),
      limit,
      cursor,
      sortOrder
    );
  }

  /**
   * Lists audit events by user ID
   * @param userId - The user ID
   * @param limit - Maximum number of items to return
   * @param cursor - Pagination cursor
   * @param sortOrder - Sort order for results
   * @returns List of audit events with pagination info
   */
  async listByUser(
    userId: string,
    limit: number = 25,
    cursor?: string,
    sortOrder: DdbSortOrder = DdbSortOrder.DESC
  ): Promise<AuditListResult> {
    return this.listByGsi(
      this.userGsi3Name,
      AuditKeyBuilders.buildUserGsi3Pk(userId),
      limit,
      cursor,
      sortOrder
    );
  }

  /**
   * Lists audit events by event type
   * @param eventType - The audit event type
   * @param limit - Maximum number of items to return
   * @param cursor - Pagination cursor
   * @param sortOrder - Sort order for results
   * @returns List of audit events with pagination info
   */
  async listByEventType(
    eventType: AuditEventType,
    limit: number = 25,
    cursor?: string,
    sortOrder: DdbSortOrder = DdbSortOrder.DESC
  ): Promise<AuditListResult> {
    return this.listByGsi(
      this.typeGsi4Name,
      AuditKeyBuilders.buildTypeGsi4Pk(eventType),
      limit,
      cursor,
      sortOrder
    );
  }

  /**
   * Lists audit events by date range
   * @param startDate - Start date for the range
   * @param endDate - End date for the range
   * @param limit - Maximum number of items to return
   * @param cursor - Pagination cursor
   * @param sortOrder - Sort order for results
   * @returns List of audit events with pagination info
   */
  async listByDateRange(
    startDate: Date,
    endDate: Date,
    limit: number = 25,
    cursor?: string,
    sortOrder: DdbSortOrder = DdbSortOrder.DESC
  ): Promise<AuditListResult> {
    const startTimestamp = startDate.toISOString();
    const endTimestamp = endDate.toISOString();

    try {
      requireQuery(this.ddb);
      
      const decodedCursor = cursor ? decodeCursor<AuditListCursorPayload>(cursor) : undefined;
      const afterTimestamp = decodedCursor?.timestamp;

      const res = await this.ddb.query({
        TableName: this.tableName,
        IndexName: this.envelopeGsi1Name,
        KeyConditionExpression: 
          '#gsi1pk = :envelopePrefix' + 
          (afterTimestamp ? ' AND #gsi1sk > :afterTimestamp' : '') +
          ' AND #gsi1sk BETWEEN :startTimestamp AND :endTimestamp',
        ExpressionAttributeNames: {
          '#gsi1pk': 'gsi1pk',
          '#gsi1sk': 'gsi1sk'
        },
        ExpressionAttributeValues: {
          ':envelopePrefix': 'ENVELOPE#',
          ':startTimestamp': startTimestamp,
          ':endTimestamp': endTimestamp,
          ...(afterTimestamp ? { ':afterTimestamp': afterTimestamp } : {})
        },
        Limit: limit + 1,
        ScanIndexForward: sortOrder === DdbSortOrder.ASC
      });

      const items = (res.Items || []).slice(0, limit);
      const hasMore = (res.Items || []).length > limit;

      const auditEvents = items
        .filter(isAuditDdbItem)
        .map(item => auditItemMapper.fromDTO(item));

      const lastItem = items[items.length - 1];
      const nextCursor = hasMore && lastItem && isAuditDdbItem(lastItem)
        ? encodeCursor({
            auditEventId: lastItem.auditEventId,
            timestamp: lastItem.timestamp,
            createdAt: lastItem.createdAt,
            id: lastItem.auditEventId
          } as any)
        : undefined;

      return {
        items: auditEvents,
        nextCursor,
        hasNext: !!nextCursor
      };
    } catch (err: any) {
      throw mapAwsError(err, 'AuditRepository.listByDateRange');
    }
  }

  /**
   * Counts audit events by envelope ID
   * @param envelopeId - The envelope ID
   * @returns The count of audit events
   */
  async countByEnvelope(envelopeId: string): Promise<number> {
    return this.countByGsi(
      this.envelopeGsi1Name,
      AuditKeyBuilders.buildEnvelopeGsi1Pk(envelopeId)
    );
  }

  /**
   * Counts audit events by signer ID
   * @param signerId - The signer ID
   * @returns The count of audit events
   */
  async countBySigner(signerId: string): Promise<number> {
    return this.countByGsi(
      this.signerGsi2Name,
      AuditKeyBuilders.buildSignerGsi2Pk(signerId)
    );
  }

  /**
   * Counts audit events by user ID
   * @param userId - The user ID
   * @returns The count of audit events
   */
  async countByUser(userId: string): Promise<number> {
    return this.countByGsi(
      this.userGsi3Name,
      AuditKeyBuilders.buildUserGsi3Pk(userId)
    );
  }

  /**
   * Counts audit events by event type
   * @param eventType - The audit event type
   * @returns The count of audit events
   */
  async countByEventType(eventType: AuditEventType): Promise<number> {
    return this.countByGsi(
      this.typeGsi4Name,
      AuditKeyBuilders.buildTypeGsi4Pk(eventType)
    );
  }

  /**
   * Generic method to list audit events by GSI
   * @param indexName - The GSI name
   * @param gsiPk - The GSI partition key
   * @param limit - Maximum number of items to return
   * @param cursor - Pagination cursor
   * @param sortOrder - Sort order for results
   * @returns List of audit events with pagination info
   */
  private async listByGsi(
    indexName: string,
    gsiPk: string,
    limit: number,
    cursor?: string,
    sortOrder: DdbSortOrder = DdbSortOrder.DESC
  ): Promise<AuditListResult> {
    try {
      requireQuery(this.ddb);
      
      const queryParams = this.buildQueryParams(indexName, gsiPk, cursor, limit, sortOrder);
      const res = await this.executeQuery(queryParams);
      return this.processQueryResults(res, limit);
    } catch (err: any) {
      throw mapAwsError(err, 'AuditRepository.listByGsi');
    }
  }

  /**
   * Builds query parameters for DynamoDB query
   */
  private buildQueryParams(
    indexName: string,
    gsiPk: string,
    cursor: string | undefined,
    limit: number,
    sortOrder: DdbSortOrder
  ) {
    const decodedCursor = cursor ? decodeCursor<AuditListCursorPayload>(cursor) : undefined;
    const afterTimestamp = decodedCursor?.timestamp;

    const { pkAttr, skAttr } = this.getGsiAttributes(indexName);
    const { exprNames, exprVals, keyExpr } = this.buildExpressionAttributes(
      pkAttr,
      skAttr,
      gsiPk,
      afterTimestamp
    );

    this.logQueryParams(indexName, keyExpr, exprNames, afterTimestamp);

    return {
      TableName: this.tableName,
      IndexName: indexName,
      KeyConditionExpression: keyExpr,
      ExpressionAttributeNames: exprNames,
      ExpressionAttributeValues: exprVals,
      Limit: limit + 1,
      ScanIndexForward: sortOrder === DdbSortOrder.ASC
    };
  }

  /**
   * Gets GSI attribute names based on index name
   */
  private getGsiAttributes(indexName: string) {
    const gsiMap = {
      gsi1: { pkAttr: 'gsi1pk', skAttr: 'gsi1sk' },
      gsi2: { pkAttr: 'gsi2pk', skAttr: 'gsi2sk' },
      gsi3: { pkAttr: 'gsi3pk', skAttr: 'gsi3sk' },
      gsi4: { pkAttr: 'gsi4pk', skAttr: 'gsi4sk' }
    };

    return gsiMap[indexName as keyof typeof gsiMap] || gsiMap.gsi1;
  }

  /**
   * Builds expression attributes for DynamoDB query
   */
  private buildExpressionAttributes(
    pkAttr: string,
    skAttr: string,
    gsiPk: string,
    afterTimestamp?: string
  ) {
    const exprNames: Record<string, string> = { '#gsiPk': pkAttr };
    const exprVals: Record<string, any> = { ':gsiPk': gsiPk };

    let keyExpr = '#gsiPk = :gsiPk';

    if (afterTimestamp) {
      exprNames['#gsiSk'] = skAttr;
      exprVals[':afterTimestamp'] = afterTimestamp;
      keyExpr += ' AND #gsiSk > :afterTimestamp';
    }

    return { exprNames, exprVals, keyExpr };
  }

  /**
   * Logs query parameters for debugging
   */
  private logQueryParams(
    indexName: string,
    keyExpr: string,
    exprNames: Record<string, string>,
    afterTimestamp?: string
  ) {
    // eslint-disable-next-line no-console
    console.log('DDB Audit.listByGsi params', { 
      indexName, 
      keyExpr, 
      names: exprNames, 
      hasAfter: Boolean(afterTimestamp) 
    });
  }

  /**
   * Executes the DynamoDB query
   */
  private async executeQuery(queryParams: any) {
    requireQuery(this.ddb);
    const res = await this.ddb.query(queryParams);

    // eslint-disable-next-line no-console
    console.log('DDB Audit.listByGsi raw', {
      indexName: queryParams.IndexName,
      count: (res.Items || []).length,
      firstItemKeys: res.Items?.[0] ? Object.keys(res.Items[0] as any) : []
    });

    return res;
  }

  /**
   * Processes query results and builds response
   */
  private processQueryResults(res: any, limit: number): AuditListResult {
    const items = (res.Items || []).slice(0, limit);
    const hasMore = (res.Items || []).length > limit;

    const auditEvents = items
      .filter(isAuditDdbItem)
      .map((item: any) => auditItemMapper.fromDTO(item));

    const nextCursor = this.buildNextCursor(items, hasMore);

    return {
      items: auditEvents,
      nextCursor,
      hasNext: !!nextCursor
    };
  }

  /**
   * Builds next cursor for pagination
   */
  private buildNextCursor(items: any[], hasMore: boolean): string | undefined {
    const lastItem = items[items.length - 1];
    
    if (!hasMore || !lastItem || !isAuditDdbItem(lastItem)) {
      return undefined;
    }

    return encodeCursor({
      auditEventId: lastItem.auditEventId,
      timestamp: lastItem.timestamp,
      createdAt: lastItem.createdAt,
      id: lastItem.auditEventId
    } as any);
  }

  /**
   * Generic method to count audit events by GSI
   * @param indexName - The GSI name
   * @param gsiPk - The GSI partition key
   * @returns The count of audit events
   */
  private async countByGsi(indexName: string, gsiPk: string): Promise<number> {
    try {
      requireQuery(this.ddb);
      
      const res = await this.ddb.query({
        TableName: this.tableName,
        IndexName: indexName,
        KeyConditionExpression: '#gsiPk = :gsiPk',
        ExpressionAttributeNames: {
          '#gsiPk': 'gsi1pk'
        },
        ExpressionAttributeValues: {
          ':gsiPk': gsiPk
        }
      });

      return (res as any).Count || res.Items?.length || 0;
    } catch (err: any) {
      throw mapAwsError(err, 'AuditRepository.countByGsi');
    }
  }
}