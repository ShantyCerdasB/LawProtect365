/**
 * @file IdempotencyTypes.ts
 * @summary Idempotency types and interfaces
 * @description Types, interfaces, constants, and type guards for the Idempotency module
 */

// Define IdempotencyState locally since it's not in enums
export type IdempotencyState = "pending" | "completed";

/** Stable entity marker. */
export const IDEMPOTENCY_ENTITY = "Idempotency" as const;

/** Fixed sort key segment. */
export const META = "META" as const;

/** Key builders. */
export const idempotencyPk = (key: string): string => `IDEMPOTENCY#${key}`;
export const idempotencySk = (): string => META;

/**
 * @description Persisted item shape for idempotency records.
 */
export interface DdbIdempotencyItem {
  pk: string;
  sk: string;
  type: typeof IDEMPOTENCY_ENTITY;
  idempotencyKey: string;
  state: IdempotencyState;
  resultJson?: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  ttl?: number;      // epoch seconds
}

/**
 * @description Runtime guard for safe deserialization.
 * @param {unknown} v Value to validate.
 * @returns {boolean} `true` if `v` matches `DdbIdempotencyItem`.
 */
export const isDdbIdempotencyItem = (v: unknown): v is DdbIdempotencyItem => {
  const o = v as DdbIdempotencyItem;
  return Boolean(
    o &&
      typeof o === "object" &&
      typeof o.pk === "string" &&
      typeof o.sk === "string" &&
      o.type === IDEMPOTENCY_ENTITY &&
      typeof o.idempotencyKey === "string" &&
      (o.state === "pending" || o.state === "completed") &&
      typeof o.createdAt === "string" &&
      typeof o.updatedAt === "string"
  );
};
