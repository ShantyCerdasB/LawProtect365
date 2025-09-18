/**
 * @fileoverview OutboxRepository - Repository for outbox event data access
 * @summary Provides data access operations for outbox events
 * @description This repository handles all database operations for outbox events
 * including CRUD operations, queries, and data persistence for reliable messaging.
 */

import type { DdbClientLike } from '@lawprotect/shared-ts';
import { mapAwsError, ConflictError, NotFoundError, ErrorCodes, BadRequestError } from '@lawprotect/shared-ts';
import type { 
  OutboxRecord, 
  OutboxListResult, 
  OutboxCountResult,
  OutboxQueryOptions
} from '../domain/types/infrastructure/outbox';
import { 
  outboxToDdbItem, 
  outboxFromDdbItem, 
  isOutboxDdbItem,
  createOutboxRecordFromEvent,
  OutboxKeyBuilders,
  OUTBOX_STATUSES
} from '../domain/types/infrastructure/outbox';

/**
 * OutboxRepository - Repository for outbox event data access
 * 
 * Implements the outbox pattern for reliable event publishing.
 * Provides methods for saving, retrieving, and managing outbox records
 * with status tracking and retry capabilities.
 */
export class OutboxRepository {
  constructor(
    private readonly tableName: string,
    private readonly ddb: DdbClientLike
  ) {}

  /**
   * Saves a domain event to the outbox
   * @param event - Domain event to save
   * @param traceId - Optional trace ID for observability
   * @throws ConflictError if event with same ID already exists
   */
  async save(event: { id: string; type: string; payload?: Record<string, unknown>; occurredAt: string }, traceId?: string): Promise<void> {
    const record = createOutboxRecordFromEvent(event, traceId);
    const item = outboxToDdbItem(record);

    try {
      await this.ddb.put({
        TableName: this.tableName,
        Item: item as unknown as Record<string, unknown>,
        ConditionExpression: 'attribute_not_exists(pk) AND attribute_not_exists(sk)'
      });
    } catch (err: any) {
      if (String(err?.name) === 'ConditionalCheckFailedException') {
        throw new ConflictError('Outbox record already exists', ErrorCodes.COMMON_CONFLICT);
      }
      throw mapAwsError(err, 'OutboxRepository.save');
    }
  }

  /**
   * Retrieves an outbox record by ID
   * @param id - Event ID
   * @returns Outbox record or null if not found
   */
  async getById(id: string): Promise<OutboxRecord | null> {
    try {
      const result = await this.ddb.get({
        TableName: this.tableName,
        Key: OutboxKeyBuilders.buildPrimaryKey(id)
      });

      if (!result.Item) {
        return null;
      }

      if (!isOutboxDdbItem(result.Item)) {
        throw new BadRequestError('Invalid outbox item structure', 'INVALID_OUTBOX_DATA');
      }

      return outboxFromDdbItem(result.Item);
    } catch (err) {
      throw mapAwsError(err, 'OutboxRepository.getById');
    }
  }

  /**
   * Checks if an outbox record exists
   * @param id - Event ID
   * @returns True if record exists, false otherwise
   */
  async exists(id: string): Promise<boolean> {
    try {
      const result = await this.ddb.get({
        TableName: this.tableName,
        Key: OutboxKeyBuilders.buildPrimaryKey(id)
      });

      return !!result.Item;
    } catch (err) {
      throw mapAwsError(err, 'OutboxRepository.exists');
    }
  }

  /**
   * Marks an outbox record as dispatched
   * @param id - Event ID
   */
  async markDispatched(id: string): Promise<void> {
    try {
      const record = await this.getById(id);
      if (!record) {
        throw new NotFoundError('Outbox record not found', ErrorCodes.COMMON_NOT_FOUND);
      }

      const updatedRecord = { ...record, status: OUTBOX_STATUSES.DISPATCHED };
      const item = outboxToDdbItem(updatedRecord);

      await this.ddb.update!({
        TableName: this.tableName,
        Key: OutboxKeyBuilders.buildPrimaryKey(id),
        UpdateExpression: [
          'SET #status = :status',
          '#gsi1pk = :gsi1pk',
          '#gsi1sk = :gsi1sk',
          '#updatedAt = :updatedAt',
          'REMOVE #lastError'
        ].join(', '),
        ExpressionAttributeNames: {
          '#status': 'status',
          '#gsi1pk': 'gsi1pk',
          '#gsi1sk': 'gsi1sk',
          '#updatedAt': 'updatedAt',
          '#lastError': 'lastError'
        },
        ExpressionAttributeValues: {
          ':status': OUTBOX_STATUSES.DISPATCHED,
          ':gsi1pk': item.gsi1pk,
          ':gsi1sk': item.gsi1sk,
          ':updatedAt': new Date().toISOString()
        }
      });
    } catch (err) {
      throw mapAwsError(err, 'OutboxRepository.markDispatched');
    }
  }

  /**
   * Marks an outbox record as failed
   * @param id - Event ID
   * @param error - Error message
   */
  async markFailed(id: string, error: string): Promise<void> {
    try {
      const record = await this.getById(id);
      if (!record) {
        throw new NotFoundError('Outbox record not found', ErrorCodes.COMMON_NOT_FOUND);
      }

      const updatedRecord = { 
        ...record, 
        status: OUTBOX_STATUSES.FAILED,
        attempts: record.attempts + 1,
        lastError: error
      };
      const item = outboxToDdbItem(updatedRecord);

      await this.ddb.update!({
        TableName: this.tableName,
        Key: OutboxKeyBuilders.buildPrimaryKey(id),
        UpdateExpression: [
          'SET #status = :status',
          '#gsi1pk = :gsi1pk',
          '#gsi1sk = :gsi1sk',
          '#updatedAt = :updatedAt',
          '#attempts = :attempts',
          '#lastError = :lastError'
        ].join(', '),
        ExpressionAttributeNames: {
          '#status': 'status',
          '#gsi1pk': 'gsi1pk',
          '#gsi1sk': 'gsi1sk',
          '#updatedAt': 'updatedAt',
          '#attempts': 'attempts',
          '#lastError': 'lastError'
        },
        ExpressionAttributeValues: {
          ':status': OUTBOX_STATUSES.FAILED,
          ':gsi1pk': item.gsi1pk,
          ':gsi1sk': item.gsi1sk,
          ':updatedAt': new Date().toISOString(),
          ':attempts': updatedRecord.attempts,
          ':lastError': error
        }
      });
    } catch (err) {
      throw mapAwsError(err, 'OutboxRepository.markFailed');
    }
  }

  /**
   * Pulls pending outbox records for processing
   * @param limit - Maximum number of records to retrieve
   * @returns Array of pending outbox records
   */
  async pullPending(limit: number): Promise<OutboxRecord[]> {
    const pageSize = Math.min(Math.max(limit, 1), 100);

    try {
      const result = await this.ddb.query!({
        TableName: this.tableName,
        IndexName: 'gsi1',
        KeyConditionExpression: '#gsi1pk = :gsi1pk',
        ExpressionAttributeNames: {
          '#gsi1pk': 'gsi1pk'
        },
        ExpressionAttributeValues: {
          ':gsi1pk': `STATUS#${OUTBOX_STATUSES.PENDING}`
        },
        Limit: pageSize,
        ScanIndexForward: true // Oldest first
      });

      const items = (result.Items ?? []) as Array<Record<string, unknown>>;
      return items
        .filter(isOutboxDdbItem)
        .map(item => outboxFromDdbItem(item as any));
    } catch (err) {
      throw mapAwsError(err, 'OutboxRepository.pullPending');
    }
  }

  /**
   * Lists outbox records with optional filtering
   * @param options - Query options
   * @returns Paginated list of outbox records
   */
  async list(options: OutboxQueryOptions = {}): Promise<OutboxListResult> {
    const { status, eventType, limit = 50, cursor, scanIndexForward = true } = options;

    try {
      let queryParams: any = {
        TableName: this.tableName,
        IndexName: 'gsi1',
        Limit: Math.min(limit, 100),
        ScanIndexForward: scanIndexForward
      };

      if (status) {
        queryParams.KeyConditionExpression = '#gsi1pk = :gsi1pk';
        queryParams.ExpressionAttributeNames = { '#gsi1pk': 'gsi1pk' };
        queryParams.ExpressionAttributeValues = { ':gsi1pk': `STATUS#${status}` };
      } else {
        queryParams.KeyConditionExpression = 'begins_with(#gsi1pk, :gsi1pkPrefix)';
        queryParams.ExpressionAttributeNames = { '#gsi1pk': 'gsi1pk' };
        queryParams.ExpressionAttributeValues = { ':gsi1pkPrefix': 'STATUS#' };
      }

      if (eventType) {
        queryParams.FilterExpression = '#eventType = :eventType';
        queryParams.ExpressionAttributeNames = {
          ...queryParams.ExpressionAttributeNames,
          '#eventType': 'eventType'
        };
        queryParams.ExpressionAttributeValues = {
          ...queryParams.ExpressionAttributeValues,
          ':eventType': eventType
        };
      }

      if (cursor) {
        queryParams.ExclusiveStartKey = JSON.parse(Buffer.from(cursor, 'base64').toString());
      }

      const result = await this.ddb.query!(queryParams);
      const items = (result.Items ?? []) as Array<Record<string, unknown>>;
      const records = items.filter(isOutboxDdbItem).map(item => outboxFromDdbItem(item as any));

      return {
        items: records,
        cursor: result.LastEvaluatedKey ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64') : undefined,
        hasMore: !!result.LastEvaluatedKey
      };
    } catch (err) {
      throw mapAwsError(err, 'OutboxRepository.list');
    }
  }

  /**
   * Counts outbox records by status
   * @param status - Status to count
   * @returns Count result
   */
  async countByStatus(status: typeof OUTBOX_STATUSES[keyof typeof OUTBOX_STATUSES]): Promise<OutboxCountResult> {
    try {
      const result = await this.ddb.query!({
        TableName: this.tableName,
        IndexName: 'gsi1',
        KeyConditionExpression: '#gsi1pk = :gsi1pk',
        ExpressionAttributeNames: {
          '#gsi1pk': 'gsi1pk'
        },
        ExpressionAttributeValues: {
          ':gsi1pk': `STATUS#${status}`
        },
        // Note: Select: 'COUNT' is not supported in DdbClientLike interface
      });

      return {
        count: (result as any).Count || result.Items?.length || 0,
        status
      };
    } catch (err) {
      throw mapAwsError(err, 'OutboxRepository.countByStatus');
    }
  }

  /**
   * Deletes an outbox record
   * @param id - Event ID
   */
  async delete(id: string): Promise<void> {
    try {
      await this.ddb.delete({
        TableName: this.tableName,
        Key: OutboxKeyBuilders.buildPrimaryKey(id)
      });
    } catch (err) {
      throw mapAwsError(err, 'OutboxRepository.delete');
    }
  }
}
