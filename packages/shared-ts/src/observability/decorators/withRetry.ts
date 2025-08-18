import type { AsyncOp } from "./withLogging.js";
import type { AppContext } from "../../app/AppContext.js";

/**
 * Retry policy contract for decorator.
 */
export interface RetryPolicy {
  maxAttempts: number;
  /**
   * Returns true when the error should be retried.
   */
  shouldRetry?(err: unknown): boolean;
  /**
   * Backoff in milliseconds for the given attempt (1-based).
   */
  backoffMs?(attempt: number): number;
}

/**
 * Wraps an operation with retry semantics.
 * @param op Operation to wrap.
 * @param policy Retry policy.
 */
export const withRetry = <I, O>(op: AsyncOp<I, O>, policy: RetryPolicy): AsyncOp<I, O> => {
  return async (ctx: AppContext, input: I): Promise<O> => {
    let attempt = 0;
    let lastErr: unknown;
    while (attempt < Math.max(1, policy.maxAttempts)) {
      try {
        return await op(ctx, input);
      } catch (e) {
        lastErr = e;
        attempt += 1;
        const retryable = policy.shouldRetry ? policy.shouldRetry(e) : true;
        if (!retryable || attempt >= policy.maxAttempts) break;
        const delay = Math.max(0, policy.backoffMs ? policy.backoffMs(attempt) : 0);
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, delay));
      }
    }
    throw lastErr;
  };
};
