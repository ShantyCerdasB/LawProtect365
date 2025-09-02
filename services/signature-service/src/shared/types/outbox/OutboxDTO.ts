/**
 * @file OutboxDTO.ts
 * @summary DynamoDB DTO types for outbox items
 * @description Defines the DynamoDB item structure for outbox records
 */

/**
 * @summary DynamoDB item shape for outbox records
 * @description Represents the raw DynamoDB item structure
 */
export interface OutboxItemDTO {
  /** Partition key - always "OUTBOX" */
  readonly pk: string;
  /** Sort key - "ID#<id>" */
  readonly sk: string;
  /** Entity type marker */
  readonly type: "Outbox";
  /** Unique identifier */
  readonly id: string;
  /** Event type */
  readonly eventType: string;
  /** Event payload */
  readonly payload?: Record<string, unknown>;
  /** ISO timestamp */
  readonly occurredAt: string;
  /** Current status */
  readonly status: string;
  /** Attempt count */
  readonly attempts: number;
  /** Last error message */
  readonly lastError?: string;
  /** Trace ID */
  readonly traceId?: string;
  /** GSI1 partition key - "STATUS#<status>" */
  readonly gsi1pk: string;
  /** GSI1 sort key - "<occurredAt>#<id>" */
  readonly gsi1sk: string;
  /** When the record was created (ISO string) */
  readonly createdAt: string;
  /** When the record was last updated (ISO string) */
  readonly updatedAt: string;
}
