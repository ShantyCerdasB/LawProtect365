/**
 * @file IdempotencyRunner.ts
 * @description
 * Thin orchestrator over the shared `IdempotencyStore`.
 *
 * Behavior:
 *  - First request for a key:
 *      * putPending(key)
 *      * run the async fn()
 *      * putCompleted(key, result)
 *      * return result
 *  - Replays for the same key:
 *      * if "pending"  → throw 409 Conflict ("in progress")
 *      * if "completed"→ throw 409 Conflict ("already processed")
 *
 * Notes:
 *  - Purposefully does NOT depend on any AWS SDK.
 *  - Uses your shared HttpError subclasses.
 *  - Keeps complexity low; the store is responsible for conditional writes.
 */

import type { IdempotencyStore } from "@lawprotect/shared-ts";
import { ConflictError, ErrorCodes } from "@lawprotect/shared-ts";
import type { IdempotencyRunnerOptionsSchema } from "../../shared/validations/schemas/idempotency";
import { assertIdempotencyFresh } from "../../domain/rules/Idempotency.rules";

/**
 * Idempotency orchestration facade.
 * Pair with `IdempotencyKeyHasher` to derive stable keys from requests.
 */
export class IdempotencyRunner {
  private readonly defaultTtl: number;

  constructor(
    private readonly store: IdempotencyStore,
    opts: IdempotencyRunnerOptionsSchema = {}
  ) {
    this.defaultTtl = Math.max(1, Math.floor(opts.defaultTtlSeconds ?? 300));
  }

  /**
   * Executes an async computation with idempotency control for a given key.
   * @typeParam R Result type.
   * @param key Stable idempotency key (e.g., from IdempotencyKeyHasher).
   * @param fn Async computation to execute exactly once.
   * @param ttlSeconds Optional TTL for the key tracking (defaults to ctor option).
   * @returns The result of `fn()` on the first call for `key`.
   * @throws ConflictError on replays (pending/completed).
   */
  async run<R>(key: string, fn: () => Promise<R>, ttlSeconds?: number): Promise<R> {
    const ttl = Math.max(1, Math.floor(ttlSeconds ?? this.defaultTtl));

    // Fast-path: check current state
    const state = await this.store.get(key);
    if (state === "pending") {
      throw new ConflictError(
        "Idempotent request is already in progress",
        ErrorCodes.COMMON_CONFLICT
      );
    }
    if (state === "completed") {
      // Design choice: without a "getResult" in the store, we signal a replay.
      // The controller can translate this to 409 and instruct the client to use the resource URI.
      throw new ConflictError(
        "Idempotent request has already been processed",
        ErrorCodes.COMMON_CONFLICT
      );
    }

    // Validate idempotency record freshness using domain rules
    const record = await this.store.getRecord(key);
    if (record) {
      assertIdempotencyFresh({ key: record.key, expiresAt: record.expiresAt });
    }

    // Attempt to create the pending marker (single-writer via condition in the store)
    await this.store.putPending(key, ttl);

    try {
      const result = await fn();
      await this.store.putCompleted(key, result as unknown, ttl);
      return result;
    } catch (err) {
      // Do not mark completed; pending will naturally expire by TTL.
      // If you want to actively remove/mark failed, extend the store contract.
      // Re-throw the error to maintain the original behavior
      throw err;
    }
  }
}
