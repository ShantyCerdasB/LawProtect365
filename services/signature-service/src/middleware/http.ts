import type { HandlerFn } from "@lawprotect/shared-ts";
import { compose, type BeforeMiddleware, type AfterMiddleware } from "@lawprotect/shared-ts";
import { apiHandler } from "@lawprotect/shared-ts";
import { buildCorsHeaders } from "@lawprotect/shared-ts";
import { withAuth } from "@lawprotect/shared-ts";
import { withRequestContext as withReqIds } from "@lawprotect/shared-ts";
import { withObservability, type ObservabilityFactories } from "@lawprotect/shared-ts";
import { withControllerLogging } from "@lawprotect/shared-ts";
import type { JwtVerifyOptions } from "@lawprotect/shared-ts";
import type { CorsConfig } from "@lawprotect/shared-ts";
import { getEnv } from "@lawprotect/shared-ts";

/**
 * Options used to wrap a controller with the shared HTTP pipeline.
 */
export interface WrapControllerOptions {
  /**
   * Enables JWT verification. Defaults to true for private endpoints.
   */
  auth?: boolean;

  /**
   * Optional overrides for JWT verification (issuer, audience, jwksUri, tolerance).
   * If omitted, values are taken from the environment.
   */
  jwt?: JwtVerifyOptions;

  /**
   * Additional "before" middlewares to run prior to the handler.
   */
  before?: BeforeMiddleware[];

  /**
   * Additional "after" middlewares to run after the handler.
   */
  after?: AfterMiddleware[];

  /**
   * Factories for per-request logger, metrics, and tracer.
   * Keeps middleware SDK-agnostic.
   */
  observability: ObservabilityFactories;

  /**
   * Overrides CORS behavior. If omitted, CORS is built from environment.
   * Pass `false` to disable CORS entirely for this handler.
   */
  cors?: CorsConfig | false;
}

/**
 * Builds a CORS configuration from environment variables.
 *
 * Supported variables:
 * - CORS_ALLOWED_ORIGINS="*" or CSV list
 * - CORS_ALLOW_HEADERS="Authorization,Content-Type"
 * - CORS_ALLOW_METHODS="GET,POST,DELETE"
 * - CORS_EXPOSE_HEADERS="x-request-id"
 * - CORS_ALLOW_CREDENTIALS="true" | "false"
 * - CORS_MAX_AGE_SECONDS="600"
 */
export const corsFromEnv = (): CorsConfig => {
  const origins = (getEnv("CORS_ALLOWED_ORIGINS") || "*").trim();
  const allowOrigins = origins === "*" ? "*" : origins.split(",").map((s) => s.trim()).filter(Boolean);

  const csv = (v?: string) => (v ? v.split(",").map((s) => s.trim()).filter(Boolean) : undefined);
  const allowHeaders = csv(getEnv("CORS_ALLOW_HEADERS"));
  const allowMethods = csv(getEnv("CORS_ALLOW_METHODS")) ?? ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"];
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
    maxAgeSeconds
  };
};

/**
 * Wraps a business controller with the standard pipeline:
 * - Request IDs (x-request-id / x-trace-id)
 * - Per-request observability (logger/metrics/tracer)
 * - Optional JWT authentication
 * - Request logging (start/finish)
 * - CORS (from env unless overridden)
 *
 * The per-request AppContext is attached to the event as `(evt as any).ctx`.
 *
 * @param base Business handler.
 * @param opts Pipeline options (auth, jwt, middlewares, observability, cors).
 * @returns A Lambda-ready handler with uniform behavior.
 */
export const wrapController = (
  base: HandlerFn,
  opts: WrapControllerOptions
): HandlerFn => {
  const { before = [], after = [], observability, auth = true, jwt, cors } = opts;

  const builtCors = cors === false ? undefined : (cors ?? corsFromEnv());
  const corsHeaders = builtCors ? buildCorsHeaders(builtCors) : {};

  const logging = withControllerLogging();

  const pipeline = compose(base, {
    before: [
      withReqIds(),
      withObservability(observability),
      ...(auth ? [withAuth.bind(null, jwt ?? {}) as unknown as BeforeMiddleware] : []),
      ...before
    ],
    after: [
      logging.after,
      ...after
    ]
  });

  // Ensures CORS, default headers and consistent error mapping.
  return apiHandler(pipeline, { cors: builtCors, defaultHeaders: corsHeaders });
};

/**
 * Helper for public endpoints (no JWT).
 *
 * @param base Business handler.
 * @param opts Same as WrapControllerOptions but with auth disabled.
 */
export const wrapPublicController = (
  base: HandlerFn,
  opts: Omit<WrapControllerOptions, "auth">
): HandlerFn => wrapController(base, { ...opts, auth: false });
