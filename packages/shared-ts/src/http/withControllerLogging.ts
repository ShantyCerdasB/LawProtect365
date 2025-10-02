import type { BeforeMiddleware, AfterMiddleware } from "./middleware.js";

/**
 * Logs a lightweight start/finish line per request with lat/route/method/status.
 */
export const withControllerLogging = (): { before: BeforeMiddleware; after: AfterMiddleware } => {
  let start = 0;

  const before: BeforeMiddleware = (evt) => {
    start = Date.now();
    const ctx = (evt as any).ctx;
    ctx?.logger?.info("http:start", {
      method: evt.requestContext?.http?.method,
      path: evt.requestContext?.http?.path
    });
  };

  const after: AfterMiddleware = (evt, res) => {
    const ms = Date.now() - start;
    const ctx = (evt as any).ctx;
    const status = (typeof res === "string" ? 200 : (res as any)?.statusCode) ?? 200;
    ctx?.logger?.info("http:finish", {
      status,
      ms
    });
    // Optionally expose request id
    if (typeof res !== "string") {
      res.headers = {
        ...res.headers,
        "x-request-id": (evt.headers?.["x-request-id"] as string) ?? ""
      };
    }
    return res;
  };

  return { before, after };
};
