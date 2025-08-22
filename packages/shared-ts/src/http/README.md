# HTTP Module — What each file provides & how to use it

Import helpers from the shared package:

```ts
import {
  // Types & status
  HttpStatus,
  type Headers,
  type ApiEvent,
  type ApiResponse,
  type ApiResponseStructured,
  type HandlerFn,

  // CORS
  buildCorsHeaders,
  isPreflight,
  preflightResponse,

  // Wrapper
  apiHandler,
  type ApiHandlerOptions,

  // Pipeline
  compose,
  type BeforeMiddleware,
  type AfterMiddleware,
  type OnErrorMiddleware,
  type ControllerPipeline,

  // Middleware
  withRequestContext,
  withObservability,
  withControllerLogging,

  // Request utils
  getHeader,
  getPathParam,
  getQueryParam,
  getJsonBody,

  // Response builders
  json,
  ok,
  created,
  noContent,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  unsupportedMedia,
  unprocessable,
  tooManyRequests,
  internalError,
  notImplemented,
} from "@lawprotect365/shared/http";

import type { CorsConfig } from "@lawprotect365/shared/types";
```

## Where this sits in a hex microservice

* **Primary adapter (HTTP/Lambda/API Gateway)** uses this module.
* **Application/Domain** stay unaware of HTTP. Controllers parse input, call use cases, and format output using these helpers.
* **Infra** wiring (logger/metrics/tracer) is injected via the provided middlewares.

---

## `httpTypes.ts`

**Purpose:** common HTTP types and status codes.

* `enum HttpStatus` — standard HTTP status constants (200, 201, 204, 400, 401, 403, 404, 409, 415, 422, 429, 500, 501).
* `type Headers = Record<string, string>` — simple header map.
* `type ApiEvent` — API Gateway v2 event type.
* `type ApiResponse` — API Gateway v2 union response (string or object).
* `type ApiResponseStructured` — always-structured API Gateway v2 response.
* `type HandlerFn = (evt: ApiEvent) => Promise<ApiResponse>` — normalized async handler.

**Use when:** typing controllers and responses in the HTTP adapter.

---

## `cors.ts`

**Purpose:** build and handle CORS headers consistently.

* `buildCorsHeaders(cfg: CorsConfig): Headers`

  * **cfg**: `{ allowOrigins: string[]|"*", allowMethods?, allowHeaders?, exposeHeaders?, allowCredentials?, maxAgeSeconds? }`
  * **returns**: headers with proper `Access-Control-*` fields.

* `isPreflight(evt: ApiEvent): boolean`

  * **returns** `true` if the request method is `OPTIONS`.

* `preflightResponse(headers: Headers): ApiResponse`

  * **returns** a `204` response with provided headers.

**Use when:** enabling CORS on public endpoints or API Gateway integrations.

---

## `apiHandler.ts`

**Purpose:** wrap a business `HandlerFn` with CORS, error mapping, and default headers.

* `interface ApiHandlerOptions`

  * `cors?: CorsConfig` — if present, preflight is auto-handled and CORS headers added to all responses.
  * `defaultHeaders?: Headers` — merged into every response.

* `apiHandler(fn: HandlerFn, opts?: ApiHandlerOptions): HandlerFn`

  * **fn**: your business handler.
  * **opts**: optional CORS/headers.
  * **behavior**:

    * Handles `OPTIONS` preflight when `cors` is provided.
    * Catches errors and renders them via `mapError` (includes `x-request-id` when available).
    * Ensures the output is a structured API Gateway response and merges headers.

**Use when:** exporting your Lambda handler for an HTTP endpoint.

---

## `middleware.ts`

**Purpose:** compose before/after/onError middlewares around a handler.

* `type BeforeMiddleware = (evt: ApiEvent) => void | ApiResponse | Promise<void | ApiResponse>`

  * Returning a response short-circuits the pipeline.

* `type AfterMiddleware = (evt: ApiEvent, res: ApiResponse) => ApiResponse | Promise<ApiResponse>`

* `type OnErrorMiddleware = (evt: ApiEvent, err: unknown) => ApiResponse | Promise<ApiResponse>`

* `interface ControllerPipeline { before?: BeforeMiddleware[]; after?: AfterMiddleware[]; onError?: OnErrorMiddleware[] }`

* `compose(base: HandlerFn, pipe?: ControllerPipeline): HandlerFn`

  * **base**: the business handler (often already wrapped by `apiHandler`).
  * **pipe**: arrays of middlewares.
  * **returns**: a new handler applying `before` → `base` → `after`, with `onError` fallback.

**Use when:** you want cross-cutting behavior (logging, auth prechecks, etc.) around handlers.

---

## `middleware-requestContext.ts`

**Purpose:** ensure each request has IDs for correlation.

* `withRequestContext(): BeforeMiddleware`

  * Generates and normalizes `x-request-id` and `x-trace-id` on `evt.headers` if missing (uses ULID fallback).
  * **returns** nothing; mutates event headers in-place.

**Use when:** you need consistent IDs for logs/metrics/traces across the request lifecycle.

---

## `middleware-observability.ts`

**Purpose:** attach logger/metrics/tracer to the event context.

* `interface ObservabilityFactories { logger(bindings): LoggerLike; metrics(): MetricsLike; tracer(): TracerLike }`

* `withObservability(obs: ObservabilityFactories): BeforeMiddleware`

  * Reads `x-request-id`/`x-trace-id` from headers.
  * Creates per-request `logger`, `metrics`, `tracer` and places them on `(evt as any).ctx` as an `AppContext`.
  * **returns** nothing; mutates `(evt as any).ctx`.

**Use when:** wiring your logging/metrics/tracing stacks into HTTP handlers.

---

## `middleware-logging.ts`

**Purpose:** minimal request start/finish logging.

* `withControllerLogging(): { before: BeforeMiddleware; after: AfterMiddleware }`

  * `before`: logs method and path.
  * `after`: logs status and duration; injects `x-request-id` into the response headers if structured.

**Use when:** you want simple structured logs per request without pulling a full web framework.

---

## `request.ts`

**Purpose:** utilities to read headers, params, and parse JSON safely.

* `getHeader(evt: ApiEvent, name: string): string | undefined` — case-insensitive header lookup.
* `getPathParam(evt: ApiEvent, name: string): string | undefined`
* `getQueryParam(evt: ApiEvent, name: string): string | undefined`
* `getJsonBody<T = unknown>(evt: ApiEvent): T`

  * Decodes base64 if needed and parses JSON.
  * Throws `BadRequestError("Invalid JSON body")` on parse failure.
  * **returns** parsed body (or `{}` when no body).

**Use when:** extracting inbound data inside controllers.

---

## `responses.ts`

**Purpose:** quick builders for JSON API responses.

* `json(status: HttpStatus, data?: unknown, headers?: Headers): ApiResponse` — sets `Content-Type: application/json; charset=utf-8`.
* `ok(data?: unknown, headers?: Headers)`
* `created(data?: unknown, headers?: Headers)`
* `noContent(headers?: Headers)`
* `badRequest(message = "Bad Request", details?: unknown)`
* `unauthorized(message = "Unauthorized")`
* `forbidden(message = "Forbidden")`
* `notFound(message = "Not Found")`
* `conflict(message = "Conflict")`
* `unsupportedMedia(message = "Unsupported Media Type")`
* `unprocessable(message = "Unprocessable Entity", details?: unknown)`
* `tooManyRequests(message = "Too Many Requests")`
* `internalError(message = "Internal Error")`
* `notImplemented(message = "Not Implemented")`

**Use when:** returning success/error payloads from controllers without repeating boilerplate.

---

## Typical wiring (Lambda + API Gateway v2)

```ts
import {
  apiHandler,
  compose,
  withRequestContext,
  withObservability,
  withControllerLogging,
  ok,
  getJsonBody,
} from "@lawprotect365/shared/http";
import { corsFromConfig } from "@lawprotect365/shared/config";
import type { CorsConfig } from "@lawprotect365/shared/types";

const logging = withControllerLogging();

const biz: HandlerFn = async (evt) => {
  const input = getJsonBody<{ name: string }>(evt);
  // call use case here...
  return ok({ hello: input.name });
};

export const handler = compose(
  apiHandler(biz, {
    cors: corsFromConfig({ corsAllowedOrigins: "*" } as unknown as { corsAllowedOrigins: CorsConfig["allowOrigins"] }),
    defaultHeaders: { "x-service": "example" },
  }),
  {
    before: [withRequestContext(), withObservability({
      logger: (b) => yourLogger.child(b),
      metrics: () => yourMetrics,
      tracer: () => yourTracer,
    }), logging.before],
    after: [logging.after],
  }
);
```

**Notes**

* Keep use cases/domain pure; perform HTTP parsing/formatting only in the adapter.
* Let `apiHandler` handle CORS and error rendering; don’t duplicate try/catch in controllers.
