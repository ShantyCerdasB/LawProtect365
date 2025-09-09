import type { AppContext } from "..\..\AppContext.js";

/**
 * Async operation signature used by decorators.
 */
export type AsyncOp<I, O> = (ctx: AppContext, input: I) => Promise<O>;

/**
 * Logging decorator options.
 */
export interface LoggingOptions {
  name?: string;
  level?: "debug" | "info";
  includeInput?: boolean;
  includeOutput?: boolean;
}

/**
 * Wraps an operation with structured logging.
 * @param op Operation to wrap.
 * @param opts Logging options.
 */
export const withLogging = <I, O>(
  op: AsyncOp<I, O>,
  opts: LoggingOptions = {}
): AsyncOp<I, O> => {
  const level = opts.level ?? "info";

  // Ensure a non-empty operation name, falling back to "operation" when anonymous.
  const rawName = opts.name ?? op.name;
  const name = typeof rawName === "string" && rawName.trim() ? rawName : "operation";

  return async (ctx, input) => {
    const start = Date.now();

    ctx.logger[level](
      `${name}:start`,
      opts.includeInput ? { input } : undefined
    );

    try {
      const out = await op(ctx, input);
      const ms = Date.now() - start;

      ctx.logger[level](
        `${name}:ok`,
        { ms, ...(opts.includeOutput ? { output: out } : {}) }
      );

      return out;
    } catch (e) {
      const ms = Date.now() - start;
      ctx.logger.error(`${name}:error`, { ms, err: e });
      throw e;
    }
  };
};
