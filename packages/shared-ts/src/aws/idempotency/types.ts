/**
 * @file types.ts
 * @summary Idempotency DynamoDB types
 * @description DynamoDB-specific types for idempotency implementation
 */

/**
 * DynamoDB item structure for idempotency records.
 */
export interface DdbIdempotencyItem {
  pk: string;
  sk: string;
  type: "Idempotency";
  idempotencyKey: string;
  state: "pending" | "completed";
  resultJson?: string;
  createdAt: string;
  updatedAt: string;
  ttl?: number;
}

/**
 * Type guard for DdbIdempotencyItem.
 */
export const isDdbIdempotencyItem = (item: any): item is DdbIdempotencyItem => {
  return (
    item &&
    typeof item === "object" &&
    typeof item.pk === "string" &&
    typeof item.sk === "string" &&
    item.type === "Idempotency" &&
    typeof item.idempotencyKey === "string" &&
    (item.state === "pending" || item.state === "completed") &&
    typeof item.createdAt === "string" &&
    typeof item.updatedAt === "string"
  );
};

/**
 * Builds the partition key for idempotency records.
 */
export const idempotencyPk = (key: string): string => `IDEMPOTENCY#${key}`;

/**
 * Builds the sort key for idempotency records.
 */
export const idempotencySk = (): string => "META";
