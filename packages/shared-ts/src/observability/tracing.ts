import { ulid } from "ulid";
import { getRequestContext, setContextFields } from "./context.js";
import { startTimer } from "./timers.js";
import { logger } from "./logger.js";

/**
 * Span represents a timed operation within a trace.
 */
export interface Span {
  /** Span identifier. */
  id: string;
  /** Span name. */
  name: string;
  /** Optional attributes describing the span. */
  attributes?: Record<string, unknown>;
  /** Ends the span and returns the duration in ms. */
  end(additionalAttributes?: Record<string, unknown>): number;
  /** Adds a discrete event annotation to the span. */
  addEvent(event: string, attributes?: Record<string, unknown>): void;
}

/**
 * Starts a span bound to the current request context.
 * @param name Span name.
 * @param attributes Initial attributes.
 */
export const startSpan = (name: string, attributes?: Record<string, unknown>): Span => {
  const id = ulid();
  const t = startTimer();

  // Surface current parent span for nested spans
  const ctx = getRequestContext();
  const parentSpanId = (ctx?.fields?.["spanId"] as string | undefined) ?? ctx?.parentSpanId;
  setContextFields({ spanId: id, parentSpanId });

  const addEvent = (event: string, attrs?: Record<string, unknown>) => {
    logger.debug("span.event", { span: name, spanId: id, event, ...attrs });
  };

  const end = (extra?: Record<string, unknown>) => {
    const ms = t.end();
    logger.info("span.end", { span: name, spanId: id, durationMs: ms, ...attributes, ...extra });
    // Restore parent span id for subsequent logs
    setContextFields({ spanId: parentSpanId });
    return ms;
  };

  logger.debug("span.start", { span: name, spanId: id, ...attributes });

  return { id, name, attributes, end, addEvent };
};

/**
 * Runs an async function within a span and returns its result.
 * @param name Span name.
 * @param fn Async function to execute.
 */
export const runWithSpan = async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
  const span = startSpan(name);
  try {
    const result = await fn();
    span.end();
    return result;
  } catch (err) {
    span.addEvent("error", { message: (err as Error)?.message });
    span.end({ error: true });
    throw err;
  }
};
