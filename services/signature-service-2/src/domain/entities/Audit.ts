/**
 * @file Audit.ts
 * @summary Audit domain entity types
 * @description Shared types for audit domain entities and persistence
 */

/**
 * @summary DynamoDB persistence shape for an immutable audit event
 * @description DynamoDB persistence shape for an immutable audit event.
 * Values are plain JSON-compatible types.
 */
export interface DdbAuditItem {
  /** Partition key */
  readonly pk: string;
  /** Sort key */
  readonly sk: string;
  /** Entity type marker */
  readonly type: string;

  /** Event identifier */
  readonly id: string;
  /** Envelope identifier */
  readonly envelopeId: string;
  /** Event occurrence timestamp in ISO-8601 format */
  readonly occurredAt: string;
  /** Domain event type, e.g., "envelope.created" */
  readonly eventType: string;

  /** Actor information */
  readonly actor?: Record<string, unknown>;
  /** Event metadata */
  readonly metadata?: Record<string, unknown>;
  /** Previous event hash for chain linking */
  readonly prevHash?: string;
  /** Current event hash */
  readonly hash?: string;

  /** GSI1 partition key for envelope queries */
  readonly gsi1pk: string;
  /** GSI1 sort key for envelope queries */
  readonly gsi1sk: string;
  /** GSI2 partition key for ID queries */
  readonly gsi2pk: string;
}

/**
 * @summary Runtime guard to ensure a raw object looks like a DdbAuditItem
 * @description Runtime guard to ensure a raw object looks like a DdbAuditItem.
 * @param value - Arbitrary value to check
 * @returns True when minimal required fields are present
 */
export function isDdbAuditItem(value: unknown): value is DdbAuditItem {
  const o = value as DdbAuditItem;
  return (
    !!o &&
    typeof o === "object" &&
    typeof o.pk === "string" &&
    typeof o.sk === "string" &&
    typeof o.type === "string" &&
    typeof o.id === "string" &&
    typeof o.envelopeId === "string" &&
    typeof o.occurredAt === "string" &&
    typeof o.eventType === "string" &&
    typeof o.gsi1pk === "string" &&
    typeof o.gsi1sk === "string" &&
    typeof o.gsi2pk === "string"
  );
}

