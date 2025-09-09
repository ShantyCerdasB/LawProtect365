/**
 * @file types.ts
 * @summary Outbox types for DynamoDB implementation
 * @description Types and constants for outbox pattern implementation
 */

export const DEFAULT_ENTITY_INDEX = "GSI1";

export const OUTBOX_PARTITION_KEY = "OUTBOX";
export const OUTBOX_SORT_KEY_PREFIX = "ID#";
export const OUTBOX_STATUS_PK_PREFIX = "STATUS#";

export const OUTBOX_STATUSES = {
  PENDING: "pending",
  DISPATCHED: "dispatched", 
  FAILED: "failed"
} as const;

export interface OutboxRepositoryDdbProps {
  tableName: string;
  client: any;
  indexes?: {
    byStatus?: string;
  };
}

export interface AwsOutboxRepoCreateInput {
  id: string;
  eventType: string;
  payload?: Record<string, unknown>;
  occurredAt: string;
  traceId?: string;
}

export interface OutboxItemDTO {
  pk: string;
  sk: string;
  type: string;
  id: string;
  eventType: string;
  payload?: Record<string, unknown>;
  occurredAt: string;
  status: string;
  gsi1pk: string;
  gsi1sk: string;
  attempts: number;
  traceId?: string;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}
