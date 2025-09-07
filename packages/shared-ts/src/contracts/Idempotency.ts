/**
 * Idempotency record with metadata.
 */
export interface IdempotencyRecord {
  /** Idempotency key. */
  key: string;
  /** Current state. */
  state: "pending" | "completed";
  /** Expiration timestamp in ISO format. */
  expiresAt: string;
  /** Result snapshot when completed (optional). */
  result?: unknown;
  /** Creation timestamp. */
  createdAt: string;
  /** Last update timestamp. */
  updatedAt: string;
}

/**
 * Store for idempotency records.
 * Implementations persist execution state keyed by an idempotency key.
 */
export interface IdempotencyStore {
  /**
   * Retrieves the state for a key.
   * @param key Idempotency key.
   * @returns State string or null when not tracked.
   */
  get(key: string): Promise<"pending" | "completed" | null>;

  /**
   * Retrieves the full record for a key.
   * @param key Idempotency key.
   * @returns Full record or null when not found.
   */
  getRecord(key: string): Promise<IdempotencyRecord | null>;

  /**
   * Marks a key as pending with a TTL.
   * @param key Idempotency key.
   * @param ttlSeconds Expiration in seconds.
   */
  putPending(key: string, ttlSeconds: number): Promise<void>;

  /**
   * Marks a key as completed with a result snapshot and TTL.
   * @param key Idempotency key.
   * @param result Result snapshot (JSON-serializable).
   * @param ttlSeconds Expiration in seconds.
   */
  putCompleted(key: string, result: unknown, ttlSeconds: number): Promise<void>;
}

/**
 * Idempotency execution facade.
 */
export interface Idempotency {
  /**
   * Executes an async function with idempotency control for a given key.
   * @param key Idempotency key.
   * @param fn Async computation to protect.
   * @param ttlSeconds Optional TTL for tracking entries.
   * @returns Result of the computation (from cache when repeated).
   */
  run<R>(key: string, fn: () => Promise<R>, ttlSeconds?: number): Promise<R>;
}
