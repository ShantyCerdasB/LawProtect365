import type { BeforeMiddleware } from "./middleware.js";
import type { AppContext, LoggerLike, MetricsLike, TracerLike } from "@app/AppContext.js";

/**
 * Factories to create per-request logger/metrics/tracer instances.
 * Each service can pass its own wiring (pino/datadog/otel/etc.).
 */
export interface ObservabilityFactories {
  logger: (bindings: Record<string, unknown>) => LoggerLike;
  metrics: () => MetricsLike;
  tracer: () => TracerLike;
}

/**
 * Binds logger, metrics and tracer to the event for downstream code.
 * The handler can read them from (evt as any).ctx (simple and explicit).
 */
export const withObservability = (
  obs: ObservabilityFactories
): BeforeMiddleware => {
  return (evt) => {
    const reqId =
      evt.headers?.["x-request-id"] ??
      evt.headers?.["X-Request-Id"];

    const traceId =
      evt.headers?.["x-trace-id"] ??
      evt.headers?.["X-Trace-Id"];

    const logger = obs.logger({
      requestId: reqId,
      traceId,
      route: evt.requestContext?.http?.path,
      method: evt.requestContext?.http?.method
    });

    const metrics = obs.metrics();
    const tracer = obs.tracer();

    (evt as any).ctx = {
      env: process.env.ENV ?? "dev",
      requestId: reqId,
      logger,
      metrics,
      tracer,
      bag: {}
    } as AppContext;
  };
};
