/**
 * @fileoverview BaseRepository - Shared repository functionality
 * @summary Provides common repository operations and pagination logic
 * @description Base class containing shared functionality for DynamoDB repositories
 * including pagination, cursor handling, and common query patterns.
 */

import { DdbClientLike, mapAwsError, encodeCursor, requireQuery } from '@lawprotect/shared-ts';
import { DdbSortOrder } from '../domain/types/infrastructure/common';

/**
 * Generic list result interface
 */
export interface ListResult<T> {
  items: T[];
  nextCursor?: string;
  hasMore: boolean;
}

/**
 * Generic cursor payload interface
 */
export interface CursorPayload {
  [key: string]: string;
}

/**
 * Query configuration for paginated queries
 */
export interface QueryConfig {
  tableName: string;
  indexName: string;
  gsiPkAttribute: string;
  gsiSkAttribute?: string;
  pkValue: string;
  cursor?: CursorPayload;
  limit: number;
  sortOrder: DdbSortOrder;
  ddb: DdbClientLike;
}

/**
 * Advanced query configuration for complex pagination patterns
 */
export interface AdvancedQueryConfig {
  tableName: string;
  indexName: string;
  keyConditionExpression: string;
  expressionAttributeNames: Record<string, string>;
  expressionAttributeValues: Record<string, any>;
  cursor?: CursorPayload;
  limit: number;
  sortOrder: DdbSortOrder;
  ddb: DdbClientLike;
  exclusiveStartKeyBuilder?: (cursor: CursorPayload) => Record<string, any>;
}

/**
 * Base repository class with shared functionality
 */
export abstract class BaseRepository {
  constructor(
    protected readonly tableName: string,
    protected readonly ddb: DdbClientLike
  ) {}

  /**
   * Executes a paginated query with cursor support
   */
  protected async executePaginatedQuery<TEntity, TItem, TCursor extends CursorPayload>(
    config: QueryConfig,
    itemValidator: (item: any) => item is TItem,
    mapper: {
      fromDTO: (item: TItem) => TEntity;
      toDTO: (entity: TEntity) => any;
    },
    cursorBuilder: (entity: TEntity) => TCursor,
    errorContext: string
  ): Promise<ListResult<any>> {
    const take = Math.max(1, Math.min(config.limit, 100)) + 1;
    const c = config.cursor;

    requireQuery(config.ddb);

    try {
      const exprNames: Record<string, string> = { [`#${config.gsiPkAttribute}`]: config.gsiPkAttribute };
      if (c && config.gsiSkAttribute) {
        exprNames[`#${config.gsiSkAttribute}`] = config.gsiSkAttribute;
      }

      const keyConditionExpression = `#${config.gsiPkAttribute} = :pkValue` + 
        (c && config.gsiSkAttribute ? ` AND #${config.gsiSkAttribute} > :after` : '');

      const expressionAttributeValues: Record<string, any> = {
        ':pkValue': config.pkValue
      };

      if (c && config.gsiSkAttribute) {
        // Build the after value based on the cursor
        const afterValue = this.buildAfterValue(c, config.gsiSkAttribute);
        expressionAttributeValues[':after'] = afterValue;
      }

      const result = await config.ddb.query({
        TableName: config.tableName,
        IndexName: config.indexName,
        KeyConditionExpression: keyConditionExpression,
        ExpressionAttributeNames: exprNames,
        ExpressionAttributeValues: expressionAttributeValues,
        Limit: take,
        ScanIndexForward: config.sortOrder === DdbSortOrder.ASC
      });

      const items = (result.Items || []) as any[];
      const entities = items
        .filter(item => itemValidator(item))
        .map(item => mapper.fromDTO(item));

      const hasMore = entities.length === take;
      const resultItems = entities.slice(0, take - 1);

      const last = resultItems.at(-1);
      const nextCursor = hasMore && last
        ? encodeCursor(cursorBuilder(last))
        : undefined;

      return {
        items: resultItems.map(entity => mapper.toDTO(entity)),
        nextCursor,
        hasMore
      };
    } catch (err: any) {
      throw mapAwsError(err, errorContext);
    }
  }

  /**
   * Builds the "after" value for cursor-based pagination
   * This method should be overridden by subclasses to handle entity-specific cursor logic
   */
  protected buildAfterValue(_cursor: CursorPayload, _gsiSkAttribute: string): string {
    // Default implementation - subclasses should override this
    throw new Error('buildAfterValue must be implemented by subclass');
  }

  /**
   * Executes a count query
   */
  protected async executeCountQuery(
    tableName: string,
    indexName: string,
    gsiPkAttribute: string,
    pkValue: string,
    ddb: DdbClientLike,
    errorContext: string
  ): Promise<number> {
    requireQuery(ddb);

    try {
      const result = await ddb.query({
        TableName: tableName,
        IndexName: indexName,
        KeyConditionExpression: `#${gsiPkAttribute} = :pkValue`,
        ExpressionAttributeNames: {
          [`#${gsiPkAttribute}`]: gsiPkAttribute
        },
        ExpressionAttributeValues: {
          ':pkValue': pkValue
        }
      });

      return (result as any).Count || result.Items?.length || 0;
    } catch (err: any) {
      throw mapAwsError(err, errorContext);
    }
  }

  /**
   * Executes a single-item query
   */
  protected async executeSingleItemQuery<TEntity, TItem>(
    tableName: string,
    indexName: string,
    gsiPkAttribute: string,
    pkValue: string,
    ddb: DdbClientLike,
    itemValidator: (item: any) => item is TItem,
    mapper: { fromDTO: (item: TItem) => TEntity },
    errorContext: string
  ): Promise<TEntity | null> {
    requireQuery(ddb);

    try {
      const result = await ddb.query({
        TableName: tableName,
        IndexName: indexName,
        KeyConditionExpression: `#${gsiPkAttribute} = :pkValue`,
        ExpressionAttributeNames: {
          [`#${gsiPkAttribute}`]: gsiPkAttribute
        },
        ExpressionAttributeValues: {
          ':pkValue': pkValue
        },
        Limit: 1
      });

      const items = (result.Items || []) as any[];
      if (items.length === 0) {
        return null;
      }

      const item = items[0];
      if (!itemValidator(item)) {
        throw new Error('Invalid item structure');
      }

      return mapper.fromDTO(item);
    } catch (err: any) {
      throw mapAwsError(err, errorContext);
    }
  }

  /**
   * Executes an advanced paginated query with custom configuration
   */
  protected async executeAdvancedPaginatedQuery<TEntity, TItem, TCursor extends CursorPayload>(
    config: AdvancedQueryConfig,
    itemValidator: (item: any) => item is TItem,
    mapper: {
      fromDTO: (item: TItem) => TEntity;
      toDTO: (entity: TEntity) => any;
    },
    cursorBuilder: (entity: TEntity) => TCursor,
    errorContext: string
  ): Promise<ListResult<any>> {
    const take = Math.max(1, Math.min(config.limit, 100)) + 1;

    requireQuery(config.ddb);

    try {
      const queryParams: any = {
        TableName: config.tableName,
        IndexName: config.indexName,
        KeyConditionExpression: config.keyConditionExpression,
        ExpressionAttributeNames: config.expressionAttributeNames,
        ExpressionAttributeValues: config.expressionAttributeValues,
        Limit: take,
        ScanIndexForward: config.sortOrder === DdbSortOrder.ASC
      };

      // Handle cursor-based pagination
      if (config.cursor && config.exclusiveStartKeyBuilder) {
        queryParams.ExclusiveStartKey = config.exclusiveStartKeyBuilder(config.cursor);
      }

      const result = await config.ddb.query!(queryParams);

      const items = (result.Items || [])
        .filter(itemValidator)
        .slice(0, take - 1)
        .map(item => mapper.fromDTO(item as any));

      const hasMore = (result.Items || []).length > config.limit;
      const last = items[items.length - 1];
      const nextCursor = hasMore && last
        ? encodeCursor(cursorBuilder(last))
        : undefined;

      return {
        items: items.map(entity => mapper.toDTO(entity)),
        nextCursor,
        hasMore
      };
    } catch (err: any) {
      throw mapAwsError(err, errorContext);
    }
  }
}
