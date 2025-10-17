/**
 * @fileoverview OutboxRepository - Repository for outbox event data access
 * @summary Provides data access operations for outbox events
 * @description This repository handles all database operations for outbox events
 * including CRUD operations, queries, and data persistence for reliable messaging.
 */

import type { DdbClientLike } from '../../index.js';
import { mapAwsError, ConflictError, NotFoundError, ErrorCodes, BadRequestError } from '../../index.js';
import type { 
  OutboxRecord
} from './outbox-mappers.js';
import type {
  OutboxListResult, 
  OutboxCountResult,
  OutboxQueryOptions,
  OutboxDdbItem
} from './outbox-ddb-types.js';
import { 
  outboxToDdbItem, 
  outboxFromDdbItem, 
  isOutboxDdbItem,
  createOutboxRecordFromEvent
} from './outbox-mappers.js';
import {
  OutboxKeyBuilders,
  OUTBOX_STATUSES
} from './outbox-ddb-types.js';

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
   * Marks an outbox record as processed (for DynamoDB Streams)
   * @param id - Event ID
   */
  async markAsProcessed(id: string): Promise<void> {
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
      throw mapAwsError(err, 'OutboxRepository.markAsProcessed');
    }
  }

  /**
   * Pulls a batch of pending outbox records for processing
   * @param limit - Maximum number of records to return (1-100)
   * @returns Array of pending outbox records
   */
  async pullPending(limit: number): Promise<OutboxRecord[]> {
    const clampedLimit = Math.max(1, Math.min(100, Math.floor(limit || 1)));

    try {
      const result = await this.ddb.query!({
        TableName: this.tableName,
        IndexName: 'gsi1',
        KeyConditionExpression: '#gsi1pk = :gsi1pk',
        ExpressionAttributeNames: { '#gsi1pk': 'gsi1pk' },
        ExpressionAttributeValues: { ':gsi1pk': `STATUS#${OUTBOX_STATUSES.PENDING}` },
        Limit: clampedLimit,
        ScanIndexForward: true
      });

      const items = result.Items ?? [];
      return items
        .filter(isOutboxDdbItem)
        .map(item => outboxFromDdbItem(item as unknown as OutboxDdbItem));
    } catch (err) {
      throw mapAwsError(err, 'OutboxRepository.pullPending');
    }
  }

  /**
   * Marks an outbox record as failed and increments attempts
   * @param id - Event ID
   * @param error - Error description
   */
  async markFailed(id: string, error: string): Promise<void> {
    try {
      await this.ddb.update!({
        TableName: this.tableName,
        Key: OutboxKeyBuilders.buildPrimaryKey(id),
        UpdateExpression: [
          'SET #status = :status',
          '#gsi1pk = :gsi1pk',
          '#updatedAt = :updatedAt',
          '#attempts = if_not_exists(#attempts, :zero) + :one',
          '#lastError = :lastError'
        ].join(', '),
        ExpressionAttributeNames: {
          '#status': 'status',
          '#gsi1pk': 'gsi1pk',
          '#updatedAt': 'updatedAt',
          '#attempts': 'attempts',
          '#lastError': 'lastError'
        },
        ExpressionAttributeValues: {
          ':status': OUTBOX_STATUSES.FAILED,
          ':gsi1pk': `STATUS#${OUTBOX_STATUSES.FAILED}`,
          ':updatedAt': new Date().toISOString(),
          ':zero': 0,
          ':one': 1,
          ':lastError': error
        }
      });
    } catch (err) {
      throw mapAwsError(err, 'OutboxRepository.markFailed');
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
      const items = result.Items ?? [];
      const records = items.filter(isOutboxDdbItem).map(item => outboxFromDdbItem(item as unknown as OutboxDdbItem));

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
   * Gets current outbox statistics
   * @returns Statistics about outbox status
   */
  async getOutboxStats(): Promise<{
    pending: number;
    dispatched: number;
    failed: number;
  }> {
    try {
      const [pending, dispatched, failed] = await Promise.all([
        this.countByStatus('pending'),
        this.countByStatus('dispatched'),
        this.countByStatus('failed')
      ]);

      return {
        pending: pending.count,
        dispatched: dispatched.count,
        failed: failed.count
      };
    } catch (error) {
      throw mapAwsError(error, 'OutboxRepository.getOutboxStats');
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
