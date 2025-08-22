# Events Module — What each file provides & how to use it

Import from the shared package:

```ts
import {
  DomainEvent,
  makeEvent,
  EventBusPort,
  OutboxPort,
  makeEventPublisher,
} from "@lawprotect365/shared";
```

## Where this sits in a hex microservice

* **Domain / Use Cases**: create `DomainEvent`s and call `OutboxPort.save(...)` **in the same transaction** as your state change.
* **Infrastructure Adapters**: implement `OutboxPort` (DB) and `EventBusPort` (broker).
* **Worker / Scheduler**: use `makeEventPublisher(...).dispatch(maxBatch)` to flush the outbox to the broker.

---

## `DomainEvent.ts`

**Purpose**: canonical, broker-agnostic event shape used across services.

**Interface**

```ts
interface DomainEvent<T = unknown> {
  id: string;                          // unique id (e.g., ULID)
  type: string;                        // "namespace.name" (e.g., "signature.envelope_sent")
  occurredAt: string;                  // ISO timestamp
  payload: T;                          // event data
  metadata?: Record<string, string>;   // tracing/routing hints (e.g., x-trace-id)
}
```

**Use when**: representing a business fact emitted by the domain.

---

## `EventFactory.ts`

**Purpose**: helper to build well-formed `DomainEvent`s.

**Function**

```ts
makeEvent<T>(
  type: string,
  payload: T,
  metadata?: Record<string, string>
): DomainEvent<T>
```

* **type**: fully qualified name (`"<bounded-context>.<past-tense>"`)
* **payload**: event data (domain shape)
* **metadata**: optional tracing/routing (e.g., `{"x-trace-id": "..."}"`)

**Returns**: a `DomainEvent<T>` with generated `id` and `occurredAt`.

**Use when**: creating an event right after the domain state change succeeds.

---

## `Outbox.ts`

**Purpose**: persistence contract for the outbox pattern (store-then-publish).

**Record**

```ts
interface OutboxRecord<T = unknown> {
  id: string;
  type: string;
  payload: T;
  occurredAt: string;
  status: "pending" | "dispatched" | "failed";
  attempts: number;
  lastError?: string;
  traceId?: string;
}
```

**Port**

```ts
interface OutboxPort {
  save(evt: DomainEvent, traceId?: string): Promise<void>;
  markDispatched(id: string): Promise<void>;
  markFailed(id: string, error: string): Promise<void>;
  pullPending(limit: number): Promise<OutboxRecord[]>;
}
```

* **save**: enqueue event (call **inside** the same DB transaction as your write)
* **markDispatched**: set status to `dispatched` (idempotent)
* **markFailed**: set to `failed`, increment attempts
* **pullPending**: claim a batch to publish (implement row-locking to avoid double dispatch)

**Use when**: repositories/use cases need to enqueue events reliably with domain changes.

---

## `EventBusPort.ts`

**Purpose**: broker abstraction for publishing and (optionally) subscribing.

**Port**

```ts
interface EventBusPort {
  publish(events: readonly DomainEvent[]): Promise<void>;
  subscribe?(
    topic: string,
    handler: (event: DomainEvent) => Promise<void>
  ): Promise<void>;
}
```

* **publish**: send one or more events; adapter must tolerate duplicates (at-least-once)
* **subscribe (optional)**: register a consumer/handler (implementation-specific)

**Use when**: building adapters to EventBridge, SNS/SQS, Kafka, etc.

---

## `EventsPublisher.ts`

**Purpose**: moves records from the outbox to the event bus.

**Factory & Interface**

```ts
interface EventPublisher {
  dispatch(maxBatch: number): Promise<void>;
}

const makeEventPublisher = (bus: EventBusPort, outbox: OutboxPort): EventPublisher;
```

* **dispatch(maxBatch)**: pulls up to `maxBatch` pending records, publishes via `bus.publish([...])`, then calls `markDispatched` or `markFailed`.

**Use when**: running a worker/cron/Lambda to flush the outbox on a schedule or loop.

---

## `Envelope.ts` (optional, infra-facing)

**Purpose**: transport envelope if a broker/adapter needs extra delivery metadata beyond `DomainEvent`.

**Interface**

```ts
interface EventEnvelope<T = unknown> {
  event: DomainEvent<T>;
  messageId?: string;
  traceId?: string;
  deliveries?: number;
  source?: string;
  partitionKey?: string;
  deduplicationKey?: string;
  headers?: Record<string, string>;
}
```

**Use when**: your adapter needs to carry broker-specific fields; keep `DomainEvent` clean for domain code.

---

## Minimal usage patterns

**Produce in a use case**

```ts
const evt = makeEvent("signature.envelope_sent", { envelopeId, tenantId }, { "x-trace-id": ctx.requestId });
await outbox.save(evt, ctx.requestId);
```

**Publish in a worker**

```ts
const publisher = makeEventPublisher(eventBusAdapter, outboxAdapter);
await publisher.dispatch(100);
```

**Consume (if your adapter supports it)**

```ts
await eventBusAdapter.subscribe?.("signature.*", async (evt) => {
  // update projection or run a process manager
});
```
