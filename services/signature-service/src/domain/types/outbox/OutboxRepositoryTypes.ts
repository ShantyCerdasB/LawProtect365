/**
 * @file OutboxRepositoryTypes.ts
 * @summary Types for outbox repository operations
 * @description Defines interfaces and types for outbox repository functionality
 */

/**
 * Properties required to construct OutboxRepositoryDdb.
 */
export interface OutboxRepositoryDdbProps {
  /** DynamoDB table name for outbox records. */
  tableName: string;
  /** DynamoDB client instance. */
  client: any; // DdbClientLike from shared-ts
  /** Optional index configuration. */
  indexes?: {
    /** GSI for querying by status. Default: DEFAULT_ENTITY_INDEX. */
    byStatus?: string;
  };
}

/**
 * Input for creating a new outbox record.
 */
export interface OutboxRepoCreateInput {
  /** Unique identifier for the outbox record. */
  id: string;
  /** Type of domain event. */
  eventType: string;
  /** Event payload data. */
  payload?: Record<string, unknown>;
  /** When the event occurred (ISO string or Date). */
  occurredAt: string | Date;
  /** Optional trace ID for distributed tracing. */
  traceId?: string;
}

// Note: OutboxRecord is imported from @lawprotect/shared-ts to ensure consistency

