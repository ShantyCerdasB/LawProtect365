/**
 * @fileoverview Outbox DynamoDB types - Types for outbox DynamoDB operations
 * @summary Types for outbox pattern implementation with DynamoDB
 * @description Defines DynamoDB item structures and key builders for outbox pattern,
 * including single-table design with GSI for status-based queries.
 */

import type { BaseCursorPayload } from '../common/dynamodb-query';
import type { DdbItemWithAudit } from '../common/dynamodb-base';
import { DynamoDbPrefixes } from '../../../enums/DynamoDbPrefixes';

/**
 * Outbox DynamoDB item structure
 * Implements single-table pattern with GSI for status-based queries
 */
export interface OutboxDdbItem extends DdbItemWithAudit {
  // Event data
  id: string;                    // Unique event ID
  eventType: string;             // Domain event type
  payload?: Record<string, unknown>; // Event payload
  occurredAt: string;            // ISO timestamp
  
  // Status tracking
  status: typeof OUTBOX_STATUSES[keyof typeof OUTBOX_STATUSES];
  attempts: number;              // Retry attempts
  lastError?: string;            // Last error message
  
  // Observability
  traceId?: string;              // Distributed tracing ID
  
  // GSI1: Status-based queries
  gsi1pk: string;               // "STATUS#<status>"
  gsi1sk: string;               // "<occurredAt>#<id>"
}

/**
 * Outbox list cursor payload for pagination
 * Extends base cursor with outbox-specific fields
 */
export interface OutboxListCursorPayload extends BaseCursorPayload {
  status: string;               // Filter by status
  eventType: string;            // Filter by event type
  [key: string]: string;
}

/**
 * Outbox key builders utility class
 * Provides methods to build DynamoDB keys for outbox operations
 */
export class OutboxKeyBuilders {
  /**
   * Builds primary key for outbox record
   * @param id - Event ID
   * @returns Primary key object
   */
  static buildPrimaryKey(id: string): { pk: string; sk: string } {
    return {
      pk: DynamoDbPrefixes.OUTBOX,
      sk: `ID#${id}`
    };
  }

  /**
   * Builds GSI1 key for status-based queries
   * @param status - Event status
   * @param occurredAt - Event occurrence timestamp
   * @param id - Event ID
   * @returns GSI1 key object
   */
  static buildGsi1Key(
    status: typeof OUTBOX_STATUSES[keyof typeof OUTBOX_STATUSES],
    occurredAt: string,
    id: string
  ): { gsi1pk: string; gsi1sk: string } {
    return {
      gsi1pk: `STATUS#${status}`,
      gsi1sk: `${occurredAt}#${id}`
    };
  }

  /**
   * Builds GSI1 key for pending status queries
   * @param occurredAt - Event occurrence timestamp
   * @param id - Event ID
   * @returns GSI1 key object for pending status
   */
  static buildPendingGsi1Key(occurredAt: string, id: string): { gsi1pk: string; gsi1sk: string } {
    return this.buildGsi1Key(OUTBOX_STATUSES.PENDING, occurredAt, id);
  }

  /**
   * Builds GSI1 key for dispatched status queries
   * @param occurredAt - Event occurrence timestamp
   * @param id - Event ID
   * @returns GSI1 key object for dispatched status
   */
  static buildDispatchedGsi1Key(occurredAt: string, id: string): { gsi1pk: string; gsi1sk: string } {
    return this.buildGsi1Key(OUTBOX_STATUSES.DISPATCHED, occurredAt, id);
  }

  /**
   * Builds GSI1 key for failed status queries
   * @param occurredAt - Event occurrence timestamp
   * @param id - Event ID
   * @returns GSI1 key object for failed status
   */
  static buildFailedGsi1Key(occurredAt: string, id: string): { gsi1pk: string; gsi1sk: string } {
    return this.buildGsi1Key(OUTBOX_STATUSES.FAILED, occurredAt, id);
  }
}

/**
 * Outbox status constants
 * Centralized status values for consistency
 */
export const OUTBOX_STATUSES = {
  PENDING: 'pending',
  DISPATCHED: 'dispatched',
  FAILED: 'failed'
} as const;

/**
 * Outbox query options
 * Configuration for outbox queries
 */
export interface OutboxQueryOptions {
  status?: typeof OUTBOX_STATUSES[keyof typeof OUTBOX_STATUSES];
  eventType?: string;
  limit?: number;
  cursor?: string;
  scanIndexForward?: boolean;
}
