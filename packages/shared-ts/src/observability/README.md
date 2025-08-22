# Observability – API & Usage Guide

> Import path prefix: `@lawprotect365/shared/observability/*`

This package gives you logging, metrics, tracing, request context, redaction, timers, retry, and a thin message-bus port. It’s designed for hexagonal services:

* **Primary adapters (HTTP/queues):** create a per-request context (ids), bind logger/metrics/tracer, then call use cases.
* **Application core (use cases):** use decorators (`withLogging`, `withMetrics`, `withTracing`, `withRetry`) around operations.
* **Infrastructure adapters:** implement the ports (e.g., `MessageBusPort`) and emit metrics/logs/spans from edges.

---

## File: `messageBus.ts`

### `interface Message<T = unknown>`

Generic message for topics/queues.

* **fields**

  * `key?: string` – partition/dedup key when the broker supports it.
  * `payload: T` – message body.
  * `headers?: Record<string, string>` – custom metadata.

### `interface MessageBusPort`

Abstraction to publish/subscribe without binding to a broker.

* **publish<T>(topic: string, messages: Message<T> | Message<T>\[]): Promise<void>**
  Publish one or many messages to a logical `topic`.
* **subscribe?<T>(topic: string, handler: (msg: Message<T>) => Promise<void>): Promise<void>**
  Optional: register a consumer callback.

**Use it when:** defining an outbound port your infra adapter (SNS/SQS/Kafka/EventBridge) will implement.

---

## File: `metrics.ts`

### `type MetricUnit`

Allowed EMF units: `"Count" | "Milliseconds" | "Seconds" | "Bytes" | "Percent"`.

### `interface MetricDatum`

* `name: string`
* `unit?: MetricUnit`
* `value: number`

### `type Dimensions = Record<string, string>`

Common labels (e.g., `{ Service: "documents", Env: "dev" }`).

### `putMetrics(namespace: string, metrics: MetricDatum[], dimensions: Dimensions, timestamp = Date.now()): void`

Emit one EMF blob to CloudWatch via `console.log`.

* **namespace** e.g., `"LawProtect/Service"`.
* **metrics** array of `{ name, unit?, value }`.
* **dimensions** labels applied to the set.
* **timestamp** ms epoch (optional).

### `incr(namespace: string, name: string, dimensions: Dimensions, n = 1): void`

Counter helper (Count).

### `timing(namespace: string, name: string, ms: number, dimensions: Dimensions): void`

Latency helper (Milliseconds).

**Use it when:** you want zero-dependency CloudWatch metrics from Lambdas.

---

## File: `logger.ts`

### `type LogLevel = "debug" | "info" | "warn" | "error"`

### `type Fields = Record<string, unknown>`

### `interface Logger`

* `level: LogLevel`
* `child(bindings: Fields): Logger` – returns a logger with extra bound fields.
* `withFields(fields: Fields): Logger` – one-off bound fields (new instance).
* `debug/info/warn/error(msg: string, fields?: Fields): void`

### `createLogger(baseFields: Fields = {}, level: LogLevel = process.env.LOG_LEVEL || "info"): Logger`

Structured JSON logger to stdout/stderr. Auto-redacts sensitive keys and injects request/trace ids from the current context.

### `logger: Logger`

Process-global logger using env LOG\_LEVEL.

**Use it when:** you need a ready-to-use logger or to derive child loggers per component.

---

## File: `context.ts`

### `interface RequestContext`

* `requestId: string`
* `traceId: string`
* `parentSpanId?: string`
* `fields?: Record<string, unknown>` – arbitrary per-request fields.

### `withRequestContext<T>(ctx: Partial<RequestContext>, fn: () => T): T`

Run `fn` inside an AsyncLocalStorage scope. Missing ids are generated.

### `getRequestContext(): RequestContext | undefined`

Get current context (if any).

### `getRequestId(): string`

### `getTraceId(): string`

Return current ids or generate if absent.

### `setContextFields(patch: Record<string, unknown>): void`

Merge extra fields into the active context.

**Use it when:** your adapter begins handling a request or message; wrap the whole flow to enable correlation across logs/metrics/traces.

---

## File: `redact.ts`

### `interface RedactOptions`

* `fields?: string[]` – case-insensitive keys to redact (default includes `authorization`, `password`, `token`, etc.).
* `replacement?: string` – default `"[REDACTED]"`.
* `maxDepth?: number` – traversal cap (default `8`).

### `deepRedact<T>(value: T, opts?: RedactOptions): T`

Deeply clones/redacts matching fields in objects/arrays (cycle-safe).

**Use it when:** logging potentially sensitive payloads or configs.

---

## File: `timers.ts`

### `interface Timer { end(): number }`

`end()` returns elapsed milliseconds.

### `startTimer(): Timer`

High-resolution timer.

**Use it when:** measuring short operations with minimal overhead.

---

## File: `tracing.ts`

### `interface Span`

* `id: string`
* `name: string`
* `attributes?: Record<string, unknown>`
* `end(additionalAttributes?: Record<string, unknown>): number` – ends the span and returns duration (ms).
* `addEvent(event: string, attributes?: Record<string, unknown>): void` – annotate span.

### `startSpan(name: string, attributes?: Record<string, unknown>): Span`

Create a span tied to the current request context; logs start/end/events.

### `runWithSpan<T>(name: string, fn: () => Promise<T>): Promise<T>`

Utility to wrap an async function in a span.

**Use it when:** you want lightweight spans without a full tracing SDK (or to complement an external tracer).

---

## File: `withLogging.ts`

> Decorators operate on the `AsyncOp` signature used in use cases:
> `type AsyncOp<I, O> = (ctx: AppContext, input: I) => Promise<O>`

### `interface LoggingOptions`

* `name?: string` – operation name (defaults to function name or `"operation"`).
* `level?: "debug" | "info"` – log severity for start/ok (default `"info"`).
* `includeInput?: boolean`
* `includeOutput?: boolean`

### `withLogging<I, O>(op: AsyncOp<I, O>, opts?: LoggingOptions): AsyncOp<I, O>`

Logs `:start`, `:ok` (with ms), and `:error` around the operation.

**Use it when:** you want consistent operation logs at the application layer.

---

## File: `withMetrics.ts`

### `interface MetricsOptions`

* `name: string` – metric prefix (e.g., `"CreateEnvelope"`).
* `tags?: Record<string, string>`

### `withMetrics<I, O>(op: AsyncOp<I, O>, opts: MetricsOptions): AsyncOp<I, O>`

Emits `<name>.success|error` counters and `<name>.latency_ms` timings via `ctx.metrics`.

**Use it when:** instrumenting use cases with standardized metrics.

---

## File: `withRetry.ts`

### `interface RetryPolicy`

* `maxAttempts: number`
* `shouldRetry?(err: unknown): boolean` – default `true`.
* `backoffMs?(attempt: number): number` – attempt is **1-based**; default `0`.

### `withRetry<I, O>(op: AsyncOp<I, O>, policy: RetryPolicy): AsyncOp<I, O>`

Retries the operation per policy; delays between attempts using `backoffMs`.

**Use it when:** wrapping transiently failing operations (I/O, provider calls) at the application edge.

---

## File: `withTracing.ts`

### `interface TracingOptions`

* `name: string`
* `attributes?: Record<string, unknown>`

### `withTracing<I, O>(op: AsyncOp<I, O>, opts: TracingOptions): AsyncOp<I, O>`

Starts a span via `ctx.tracer.startSpan`, ends it on success/failure, and calls `recordException` if available.

**Use it when:** you have a tracer implementation (e.g., OpenTelemetry) wired in `AppContext` and want per-use-case spans.

---

## Hexagonal placement (quick map)

* **Primary adapters (HTTP/queue/cron):**

  * `withRequestContext` at entry.
  * Bind `logger/metrics/tracer` to `AppContext` (e.g., via your HTTP middleware).
  * Optionally use `startSpan`/`runWithSpan` for handler-level spans.

* **Application layer (use cases):**

  * Compose operations with `withLogging`, `withMetrics`, `withTracing`, `withRetry`.
  * Use `logger` from `ctx.logger` for domain-relevant logs only (no transport details).
  * Emit metrics with stable names/tags via `ctx.metrics`.

* **Infrastructure adapters:**

  * Implement `MessageBusPort` for your broker.
  * Use `putMetrics/incr/timing` in Lambda-style code paths if you don’t have a metrics client.
  * Use `createLogger().child(...)` for component-specific logs.
