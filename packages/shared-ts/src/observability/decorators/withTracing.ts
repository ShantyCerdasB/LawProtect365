import type { AsyncOp } from "./withLogging.js";

/**
 * Tracing decorator options.
 */
export interface TracingOptions {
  name: string;
  attributes?: Record<string, unknown>;
}

/**
 * Wraps an operation with a tracing span.
 * @param op Operation to wrap.
 * @param opts Tracing options.
 */
export const withTracing = <I, O>(op: AsyncOp<I, O>, opts: TracingOptions): AsyncOp<I, O> => {
  return async (ctx, input) => {
    const span = ctx.tracer.startSpan(opts.name, opts.attributes);
    try {
      const out = await op(ctx, input);
      span.end();
      return out;
    } catch (e) {
      if (span.recordException) span.recordException(e);
      span.end();
      throw e;
    }
  };
};
