import type { AppContext } from "../../app/AppContext.js";
import { deepRedact } from "../logger/redact.js";
import { toErr, DEFAULT_REDACT_KEYS } from "../logger/logger.js";

/**
 * Async domain/application operation signature.
 * @public
 */
export type AsyncOp<I, O> = (ctx: AppContext, input: I) => Promise<O>;

/**
 * Options for the logging decorator.
 * @public
 */
export interface LoggingOptions {
  /**
   * Human-friendly operation name. Defaults to the function name or "operation".
   * Appears in "name:start|ok|error" log messages.
   */
  name?: string;

  /**
   * Optional stable key for dashboards/metrics (e.g. "auth.link_oauth").
   * Useful to aggregate across renamed functions.
   */
  opKey?: string;

  /** Base level for start/ok logs. Errors are always logged at error level. */
  level?: "debug" | "info";

  /** When true, includes redacted input in the ":start" log. */
  includeInput?: boolean;

  /** When true, includes redacted output in the ":ok" log. */
  includeOutput?: boolean;
}

/**
 * Decorates an async operation with structured start/ok/error logs,
 * duration measurement, and safe redaction of input/output.
 *
 * This helper is ideal for application services and handlers where you
 * want consistent observability without scattering logging boilerplate.
 *
 * @param op - Operation to decorate.
 * @param opts - Logging options.
 * @returns A new operation with logging concerns applied.
 * @public
 */
export const withLogging = <I, O>(op: AsyncOp<I, O>, opts: LoggingOptions = {}): AsyncOp<I, O> => {
  const level = opts.level ?? "info";
  const rawName = opts.name ?? op.name;
  const name = typeof rawName === "string" && rawName.trim() ? rawName : "operation";

  return async (ctx, input) => {
    const start = Date.now();

    ctx.logger[level](`${name}:start`, {
      opKey: opts.opKey,
      ...(opts.includeInput ? { input: deepRedact(input, DEFAULT_REDACT_KEYS) } : {})
    });

    try {
      const output = await op(ctx, input);
      const ms = Date.now() - start;

      ctx.logger[level](`${name}:ok`, {
        opKey: opts.opKey,
        ms,
        ...(opts.includeOutput ? { output: deepRedact(output, DEFAULT_REDACT_KEYS) } : {})
      });

      return output;
    } catch (e) {
      const ms = Date.now() - start;
      ctx.logger.error(`${name}:error`, { opKey: opts.opKey, ms, err: toErr(e) });
      throw e;
    }
  };
};
