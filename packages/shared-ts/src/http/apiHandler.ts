import type {
  HandlerFn,
  ApiResponse,
  ApiResponseStructured,
  ApiEvent,
  Headers
} from "./httpTypes.js";
import { mapError } from "../errors/mapError.js";
import { buildCorsHeaders, isPreflight, preflightResponse } from "./cors.js";
import { CorsConfig } from "../types/corsConfig.js";

/**
 * Options for wrapping a handler with standardized HTTP behavior.
 */
export interface ApiHandlerOptions {
  /** Optional CORS configuration. When provided, preflight is handled automatically. */
  cors?: CorsConfig;
  /** Default headers to inject into every response (merged last). */
  defaultHeaders?: Headers;
}

/**
 * Ensures a structured API Gateway response.
 * @param res Union response possibly being a string.
 * @param defaultStatus Default status to apply when input is a string.
 */
const ensureStructured = (
  res: ApiResponse,
  defaultStatus = 200
): ApiResponseStructured => {
  if (typeof res === "string") {
    return { statusCode: defaultStatus, body: res };
  }
  // Some libs allow undefined body; keep as-is
  return res as ApiResponseStructured;
};

/**
 * Wraps a Lambda HTTP handler with:
 * - CORS handling (including preflight),
 * - uniform error mapping via mapError,
 * - default headers injection,
 * - requestId propagation to error responses.
 *
 * @param fn Business handler function.
 * @param opts Optional CORS and default headers.
 * @returns Wrapped handler that yields consistent API responses.
 */
export const apiHandler = (fn: HandlerFn, opts: ApiHandlerOptions = {}): HandlerFn => {
  const corsHeaders = opts.cors
    ? buildCorsHeaders({
        allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowHeaders: ["*"],
        ...opts.cors
      })
    : {};

  const mergeHeaders = (res: ApiResponse): ApiResponseStructured => {
    const structured = ensureStructured(res);
    return {
      ...structured,
      headers: {
        ...opts.defaultHeaders,
        ...corsHeaders,
        ...structured.headers
      }
    };
  };

  return async (event: ApiEvent) => {
    try {
      if (Object.keys(corsHeaders).length && isPreflight(event)) {
        return mergeHeaders(preflightResponse(corsHeaders));
      }
      const result = await fn(event);
      return mergeHeaders(result);
    } catch (err) {
      const requestId =
        event.requestContext.requestId ||
        event.headers?.["x-request-id"] ||
        event.headers?.["X-Request-Id"];

      const errorResponse = mapError(err, { requestId });
      return mergeHeaders(errorResponse);
    }
  };
};
