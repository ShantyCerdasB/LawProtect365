Here’s the updated `errors/README.md`, aligned with your latest changes (arbitrary string codes in subclasses, new 412/413/503 classes, and the single shared barrel import).

---

# Errors – API & Usage Guide

Import from the **single shared barrel**:

```ts
import {
  // Base / subclasses
  AppError,
  HttpError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  PreconditionFailedError,
  PayloadTooLargeError,
  UnsupportedMediaTypeError,
  UnprocessableEntityError,
  TooManyRequestsError,
  InternalError,
  NotImplementedError,
  ServiceUnavailableError,

  // Mappers & classifiers
  mapError,
  mapAwsError,
  isOperational,
  isRetryable,
  isClientError,
  isServerError,

  // Codes & options
  ErrorCodes,
  type ErrorCode,
  type MapErrorOptions,
} from "@lawprotect365/shared";
```

---

## Where this fits in a hexagonal service

* **Domain & Use Cases**: throw `AppError` (or an HTTP subclass) for expected business failures. Use **shared** `ErrorCodes.*` for platform-level issues (validation, auth, rate limits) and **service-specific strings** (e.g., `"SIG_ENVELOPE_ALREADY_SENT"`) for domain errors.
* **Adapters/Infra**: catch provider errors (e.g., AWS SDK) and translate with `mapAwsError` before bubbling up.
* **HTTP Controllers**: convert thrown errors to HTTP responses with `mapError`. Don’t leak raw exceptions.

```
[Infra Adapter] --(catch provider error)--> mapAwsError --> throws HttpError/AppError
[Use Case / Domain] ---------------------------------------------> throws AppError
[Controller] ---------------------------------------------> mapError(err) -> HTTP response
```

---

## Error codes

**Shared, platform-level** constants live in `ErrorCodes` (e.g., `COMMON_BAD_REQUEST`, `AUTH_UNAUTHORIZED`, `COMMON_TOO_MANY_REQUESTS`, `COMMON_DEPENDENCY_UNAVAILABLE`, etc.).

**Domain-specific** codes should be plain strings **owned by the microservice**, e.g., `"SIG_ENVELOPE_INVALID_STATE"`, `"SIG_ENVELOPE_ALREADY_SENT"`. Subclasses now accept arbitrary strings, so you can pass those directly.

---

## Classes

### `class AppError<C extends string = string | ErrorCode>`

Base class for application/domain failures.

* **Constructor**

  ```ts
  new AppError(
    code: C,
    statusCode: number,
    message?: string,
    details?: unknown,
    cause?: unknown
  )
  ```
* **Fields**

  * `code: C` – stable machine-readable code.
  * `statusCode: number` – HTTP status to transport.
  * `details?: unknown` – client-safe structured data.
  * `isOperational = true` – expected/handled error.
  * `cause?: unknown` – underlying cause for diagnostics.
* **Methods**

  * `toJSON()` → `{ error, message, details, statusCode }` (no stack).

**Use when:** Representing expected business/validation/lifecycle failures in use cases and domain logic.

---

### `abstract class HttpError<C extends string = string> extends AppError<C>`

Base for HTTP-aligned errors. Subclasses default to **shared** codes but accept **any string** so you can pass domain codes.

**Concrete subclasses (status → default message → default shared code):**

* `BadRequestError` (400) → “Bad Request” → `COMMON_BAD_REQUEST`
* `UnauthorizedError` (401) → “Unauthorized” → `AUTH_UNAUTHORIZED`
* `ForbiddenError` (403) → “Forbidden” → `AUTH_FORBIDDEN`
* `NotFoundError` (404) → “Not Found” → `COMMON_NOT_FOUND`
* `ConflictError` (409) → “Conflict” → `COMMON_CONFLICT`
* `PreconditionFailedError` (412) → “Precondition Failed” → `COMMON_PRECONDITION_FAILED`
* `PayloadTooLargeError` (413) → “Payload Too Large” → `COMMON_PAYLOAD_TOO_LARGE`
* `UnsupportedMediaTypeError` (415) → “Unsupported Media Type” → `COMMON_UNSUPPORTED_MEDIA_TYPE`
* `UnprocessableEntityError` (422) → “Unprocessable Entity” → `COMMON_UNPROCESSABLE_ENTITY`
* `TooManyRequestsError` (429) → “Too Many Requests” → `COMMON_TOO_MANY_REQUESTS`
* `InternalError` (500) → “Internal Error” → `COMMON_INTERNAL_ERROR`
* `NotImplementedError` (501) → “Not Implemented” → `COMMON_NOT_IMPLEMENTED`
* `ServiceUnavailableError` (503) → “Service Unavailable” → `COMMON_DEPENDENCY_UNAVAILABLE`

**Constructor pattern (shared across subclasses):**

```ts
new ForbiddenError(message?: string, code?: string, details?: unknown)
```

**Use when:** You know the HTTP semantics of the failure and want a thin, explicit type.

---

## Mappers & Classifiers

### `mapError(err: unknown, opts?: MapErrorOptions): APIGatewayProxyResultV2`

Renders **any** error into a consistent HTTP response (API Gateway v2).

* **Parameters**

  * `err` – thrown error (AppError/ZodError/SyntaxError/provider/unknown).
  * `opts?: MapErrorOptions`

    * `requestId?: string` – echoed in `x-request-id` header & body.
    * `exposeDetails?: boolean` – force exposing `details` (defaults to `true` in `dev`/`staging`, `false` in `prod`).
    * `headers?: Record<string,string>` – extra headers to merge.
* **Behavior**

  * `AppError` → uses its `statusCode`, `code`, `message`, `details`.
  * `ZodError` → 422 `COMMON_UNPROCESSABLE_ENTITY` (issues included).
  * JSON `SyntaxError` → 400 `COMMON_BAD_REQUEST`.
  * Recognized AWS names/codes → 429/409/400/403/404 (see table).
  * Everything else → 500 `COMMON_INTERNAL_ERROR`.
  * Adds `Content-Type: application/json; charset=utf-8`.
  * Adds `x-request-id` when provided.
  * For 429, sets `Retry-After: 1` (unless already set).

**Controller example**

```ts
try {
  // ... controller logic
} catch (err) {
  return mapError(err, { requestId: evt.requestContext.requestId });
}
```

---

### `mapAwsError(err: unknown, context: string): Error`

Translates raw AWS SDK errors to **HttpError** subclasses with stable codes.

* **Parameters**

  * `err` – error thrown by AWS SDK.
  * `context` – short string included in the message (e.g., `"EnvelopeRepository.put"`).
* **Classification**

  1. **Coarse checks (short-circuit):**

     * Throttling/Retryable → `TooManyRequestsError` (429, `COMMON_TOO_MANY_REQUESTS`)
     * AccessDenied → `ForbiddenError` (403, `AUTH_FORBIDDEN`)
     * ServiceUnavailable/5xx → `ServiceUnavailableError` (503, `COMMON_DEPENDENCY_UNAVAILABLE`)
  2. **Name/code map:**

     * `ConditionalCheckFailedException` → `ConflictError` (409)
     * `ResourceNotFoundException` / `NotFoundException` / `NoSuchKey` → `NotFoundError` (404)
     * `ValidationException` / `InvalidParameterException` → `BadRequestError` (400)
  3. **Fallback:** `InternalError` (500)

**Adapter example (DynamoDB)**

```ts
try {
  await ddb.put(...);
} catch (e) {
  throw mapAwsError(e, "IdempotencyStoreDdb.put");
}
```

---

### `isOperational(err: unknown): boolean`

Returns `true` for `AppError` with `isOperational === true`.
**Use for:** metrics/alerting routing (don’t page on expected failures).

### `isRetryable(err: unknown): boolean`

Heuristic for throttling/limit errors (`ThrottlingException`, `TooManyRequestsException`, …).
**Use for:** backoff/retry policies in infra.

### `isClientError(statusCode: number): boolean` / `isServerError(statusCode: number): boolean`

Predicates for status code families.
**Use for:** logging decisions, error metrics tags, circuit breaker signals.

---

## `MapErrorOptions`

```ts
interface MapErrorOptions {
  requestId?: string;
  exposeDetails?: boolean;
  headers?: Record<string, string>;
}
```

---

## Patterns & Examples

### Use case (domain code)

```ts
// Domain-specific code (service-owned)
const SIG_ENVELOPE_ALREADY_SENT = "SIG_ENVELOPE_ALREADY_SENT" as const;

if (alreadySent) {
  throw new ConflictError(
    "Envelope already sent",
    SIG_ENVELOPE_ALREADY_SENT,
    { envelopeId }
  );
}
```

### Controller

```ts
export const handler = async (evt: ApiGatewayEventV2) => {
  try {
    // validate with Zod (422 auto-mapped)
    // execute use case
    // return success
  } catch (err) {
    return mapError(err, { requestId: evt.requestContext.requestId });
  }
};
```

### AWS adapter

```ts
try {
  const res = await s3.send(new HeadObjectCommand(...));
  return { exists: true, size: res.ContentLength };
} catch (err) {
  throw mapAwsError(err, "S3Storage.headObject");
}
```

---

## AWS → HTTP mapping (quick reference)

| AWS condition / code                                            | HTTP error class          | Status | Error code                      |
| --------------------------------------------------------------- | ------------------------- | ------ | ------------------------------- |
| Throttling / retryable (429, `ThrottlingException`, …)          | `TooManyRequestsError`    | 429    | `COMMON_TOO_MANY_REQUESTS`      |
| Access denied (`AccessDenied`, `AccessDeniedException`)         | `ForbiddenError`          | 403    | `AUTH_FORBIDDEN`                |
| Service unavailable / AWS 5xx / dependency outage               | `ServiceUnavailableError` | 503    | `COMMON_DEPENDENCY_UNAVAILABLE` |
| `ConditionalCheckFailedException`                               | `ConflictError`           | 409    | `COMMON_CONFLICT`               |
| `ResourceNotFoundException` / `NotFoundException` / `NoSuchKey` | `NotFoundError`           | 404    | `COMMON_NOT_FOUND`              |
| `ValidationException` / `InvalidParameterException`             | `BadRequestError`         | 400    | `COMMON_BAD_REQUEST`            |

---

## Best practices

* **Codes**: Use shared `ErrorCodes.*` for platform concerns; use **plain strings** for domain errors local to your microservice.
* **No leakage**: Put provider/raw info into `cause`; keep `details` client-safe.
* **Operational vs bugs**: Throw `AppError` for expected paths; let true programmer bugs throw plain `Error` (they’ll map to 500).
* **Consistency**: Use `mapAwsError` in adapters and `mapError` in controllers so controllers stay thin.
* **Retry hints**: For retryable cases, emit metrics and honor `Retry-After` headers on 429 responses.

---

This guide documents **what** to use, **when**, and **how**, without exposing internal implementation details and matches the latest shared error API.
