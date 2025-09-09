
import type { BeforeMiddleware } from "./middleware.js";
import { ulid } from "ulid";

/**
 * Attaches a request id and trace id to the event headers if missing.
 * These ids are later used by logging/metrics/tracing.
 */
export const withRequestContext = (): BeforeMiddleware => {
  return (evt) => {
    const headers = (evt.headers ||= {});
    const reqId =
      headers["x-request-id"] ||
      headers["X-Request-Id"] ||
      evt.requestContext?.requestId ||
      ulid();

    // Normalize header in a single canonical key
    headers["x-request-id"] = String(reqId);

    // Basic trace id if caller didn't pass one
    const traceId =
      headers["x-trace-id"] ||
      headers["X-Trace-Id"] ||
      ulid();

    headers["x-trace-id"] = String(traceId);
  };
};
