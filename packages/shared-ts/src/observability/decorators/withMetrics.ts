import type { AsyncOp } from "./withLogging.js";

/**
 * Metrics decorator options.
 */
export interface MetricsOptions {
  name: string;
  tags?: Record<string, string>;
}

/**
 * Wraps an operation to record counters and timings.
 * @param op Operation to wrap.
 * @param opts Metrics options.
 */
export const withMetrics = <I, O>(op: AsyncOp<I, O>, opts: MetricsOptions): AsyncOp<I, O> => {
  return async (ctx, input) => {
    const start = Date.now();
    try {
      const out = await op(ctx, input);
      const ms = Date.now() - start;
      ctx.metrics.increment(`${opts.name}.success`, opts.tags);
      ctx.metrics.timing(`${opts.name}.latency_ms`, ms, opts.tags);
      return out;
    } catch (e) {
      const ms = Date.now() - start;
      ctx.metrics.increment(`${opts.name}.error`, opts.tags);
      ctx.metrics.timing(`${opts.name}.latency_ms`, ms, opts.tags);
      throw e;
    }
  };
};
