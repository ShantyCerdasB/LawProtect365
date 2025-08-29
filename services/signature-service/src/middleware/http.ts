/**
 * @file http.ts
 * @summary Thin HTTP wrapper that assembles the shared pipeline for this service.
 *
 * @description
 * This module provides:
 * - `wrapController`: composes the shared middlewares (request IDs, observability, optional JWT auth,
 *   controller logging) and delegates error mapping + CORS handling to the shared `apiHandler`.
 * - `wrapPublicController`: convenience wrapper with auth disabled.
 * - `corsFromEnv`: a small helper to build a CORS config from environment variables.
 *
 * Why there's no "errors middleware" here?
 * Error rendering is centralized in `apiHandler` (from `@lawprotect/shared-ts`), which uses `mapError`
 * to consistently translate thrown/returned errors into HTTP responses. Keeping it central avoids
 * duplication and reduces controller complexity.
 */

import type { HandlerFn } from "@lawprotect/shared-ts";
import {
  compose,
  apiHandler,
  buildCorsHeaders,
  withAuth,
  withRequestContext as withReqIds,
  withObservability,
  withControllerLogging,
  type BeforeMiddleware,
  type AfterMiddleware,
  type CorsConfig,
  type JwtVerifyOptions,
  type ObservabilityFactories,
  getEnv,
} from "@lawprotect/shared-ts";

/**
 * Options to wrap a business controller with the shared HTTP pipeline.
 */
export interface WrapControllerOptions {
  /** Enable JWT verification (default: true). */
  auth?: boolean;

  /** Optional overrides for JWT verification (issuer, audience, jwksUri, clock tolerance). */
  jwt?: JwtVerifyOptions;

  /** Additional "before" middlewares to run prior to the handler. */
  before?: BeforeMiddleware[];

  /** Additional "after" middlewares to run after the handler. */
  after?: AfterMiddleware[];

  /** Factories for per-request logger, metrics, and tracer (SDK-agnostic). */
  observability: ObservabilityFactories;

  /**
   * CORS configuration override. If omitted, it is built from environment via `corsFromEnv`.
   * Pass `false` to disable CORS.
   */
  cors?: CorsConfig | false;
}

/**
 * Builds a CORS configuration from environment variables.
 *
 * Supported env vars:
 * - CORS_ALLOWED_ORIGINS="*" or CSV list
 * - CORS_ALLOW_HEADERS="Authorization,Content-Type"
 * - CORS_ALLOW_METHODS="GET,POST,DELETE"
 * - CORS_EXPOSE_HEADERS="x-request-id"
 * - CORS_ALLOW_CREDENTIALS="true" | "false"
 * - CORS_MAX_AGE_SECONDS="600"
 */
export const corsFromEnv = (): CorsConfig => {
  const origins = (getEnv("CORS_ALLOWED_ORIGINS") || "*").trim();
  const allowOrigins =
    origins === "*" ? "*" : origins.split(",").map((s) => s.trim()).filter(Boolean);

  const csv = (v?: string) =>
    v ? v.split(",").map((s) => s.trim()).filter(Boolean) : undefined;

  const allowHeaders = csv(getEnv("CORS_ALLOW_HEADERS"));
  const allowMethods =
    csv(getEnv("CORS_ALLOW_METHODS")) ?? ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"];
  const exposeHeaders = csv(getEnv("CORS_EXPOSE_HEADERS"));
  const allowCredentials = /^true$/i.test(getEnv("CORS_ALLOW_CREDENTIALS") ?? "");
  const maxAge = Number(getEnv("CORS_MAX_AGE_SECONDS") ?? "600");
  const maxAgeSeconds = Number.isFinite(maxAge) ? maxAge : 600;

  return {
    allowOrigins,
    allowHeaders,
    allowMethods,
    exposeHeaders,
    allowCredentials,
    maxAgeSeconds,
  };
};

/**
 * Wraps a business controller with the standard pipeline:
 * - Request IDs (x-request-id / x-trace-id)
 * - Per-request observability (logger/metrics/tracer)
 * - Optional JWT authentication
 * - Request logging (finish)
 * - CORS (from env unless overridden)
 *
 * Errors are mapped by `apiHandler` using the shared `mapError`.
 */
export const wrapController = (base: HandlerFn, opts: WrapControllerOptions): HandlerFn => {
  const { before = [], after = [], observability, auth = true, jwt, cors } = opts;

  const builtCors = cors === false ? undefined : (cors ?? corsFromEnv());
  const corsHeaders = builtCors ? buildCorsHeaders(builtCors) : {};

  const logging = withControllerLogging();

  // Auth is applied first if enabled
  let handler: HandlerFn = auth ? withAuth(base, jwt) : base;

  // Compose remaining middlewares
  handler = compose(handler, {
    before: [withReqIds(), withObservability(observability), ...before],
    after: [logging.after, ...after],
  });

  // Let apiHandler manage CORS & error mapping uniformly
  return apiHandler(handler, { cors: builtCors, defaultHeaders: corsHeaders });
};

/** Convenience for public (no-auth) endpoints. */
export const wrapPublicController = (
  base: HandlerFn,
  opts: Omit<WrapControllerOptions, "auth">
): HandlerFn => wrapController(base, { ...opts, auth: false });
