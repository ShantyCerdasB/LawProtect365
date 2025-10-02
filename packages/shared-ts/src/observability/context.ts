import { AsyncLocalStorage } from "node:async_hooks";
import { ulid } from "ulid";

/**
 * Request-scoped context propagated via AsyncLocalStorage.
 */
export interface RequestContext {
  /** Correlation id for logs and responses. */
  requestId: string;
  /** Trace id for end-to-end correlation. */
  traceId: string;
  /** Optional parent span id for tracing trees. */
  parentSpanId?: string;
  /** Arbitrary context fields , user, etc.). */
  fields?: Record<string, unknown>;
}

const storage = new AsyncLocalStorage<RequestContext>();

/**
 * Runs a function within a request context scope.
 * @param ctx Initial context. Missing ids are auto-generated.
 * @param fn Function to execute within the scope.
 */
export const withRequestContexts = <T>(
  ctx: Partial<RequestContext>,
  fn: () => T
): T => {
  const base: RequestContext = {
    requestId: ctx.requestId ?? ulid(),
    traceId: ctx.traceId ?? ulid(),
    parentSpanId: ctx.parentSpanId,
    fields: { ...ctx.fields }
  };
  return storage.run(base, fn);
};

/**
 * Returns the current request context if any.
 */
export const getRequestContext = (): RequestContext | undefined => storage.getStore();

/**
 * Returns the current request id or generates one when absent.
 */
export const getRequestId = (): string =>
  storage.getStore()?.requestId ?? ulid();

/**
 * Returns the current trace id or generates one when absent.
 */
export const getTraceId = (): string =>
  storage.getStore()?.traceId ?? ulid();

/**
 * Merges fields into the current context.
 * @param patch Partial fields to set.
 */
export const setContextFields = (patch: Record<string, unknown>): void => {
  const current = storage.getStore();
  if (!current) return;
  current.fields = { ...current.fields, ...patch };
};
