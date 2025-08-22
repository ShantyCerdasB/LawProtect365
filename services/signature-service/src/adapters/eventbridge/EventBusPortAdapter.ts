
/**
 * @file EventBusPortAdapter.ts
 * @summary Event bus adapter that implements the shared `EventBusPort` over Amazon EventBridge.
 *
 * @description
 * Maps generic `DomainEvent` records to EventBridge entries and publishes them
 * in bounded batches via a minimal `EventBridgeClientLike` interface.
 *
 * Goals:
 * - Hexagonal: implements the shared `EventBusPort` port.
 * - Batching: chunks events into groups of up to 10 entries (EventBridge limit).
 * - Safe serialization: uses `stableStringifyUnsafe` for payload flexibility.
 * - Clear failures: surfaces partial failures as `InternalError` with structured details.
 *
 * Typical wiring:
 * - Construct with `{ busName, source, client }` in the service container.
 * - Use with `makeEventPublisher(bus, outbox)` (shared) to dispatch pending events.
 */

import {
  stableStringifyUnsafe,
  mapAwsError,
  InternalError,
  ErrorCodes,
  type EventBusPort,
  type DomainEvent,
  type EventEnvelope,
  chunk,
  type ISODateString,
} from "@lawprotect/shared-ts";
import type { EventBridgeClientLike } from "./EventBridgePublisher";

/** Construction options for the EventBridge-backed bus adapter. */
export interface EventBusPortAdapterOptions {
  /** Name or ARN of the EventBridge event bus. */
  busName: string;
  /** Logical event source (e.g., `signature-service`). */
  source: string;
  /** Minimal client capable of `putEvents`. */
  client: EventBridgeClientLike;
  /** Optional static resources to attach to each entry for routing/subscriptions. */
  resources?: string[];
  /**
   * Max entries per `putEvents` call. EventBridge enforces a hard limit of 10.
   * This value will be clamped to the range [1, 10]. Default: 10.
   */
  maxEntriesPerBatch?: number;
}

/**
 * Adapter that publishes domain events to EventBridge, implementing `EventBusPort`.
 */
export class EventBusPortAdapter implements EventBusPort {
  private readonly busName: string;
  private readonly source: string;
  private readonly client: EventBridgeClientLike;
  private readonly resources?: string[];
  private readonly batchSize: number;

  constructor(opts: EventBusPortAdapterOptions) {
    this.busName = opts.busName;
    this.source = opts.source;
    this.client = opts.client;
    this.resources = opts.resources;
    const requested = Math.floor(opts.maxEntriesPerBatch ?? 10);
    this.batchSize = Math.min(10, Math.max(1, requested));
  }

  /**
   * Publishes one or more `DomainEvent` records to EventBridge.
   *
   * @param events Array of domain events to publish.
   * @throws `InternalError` when EventBridge reports partial failures.
   * @throws Provider-specific errors normalized by `mapAwsError`.
   */
  async publish(events: DomainEvent[]): Promise<void> {
    if (!events?.length) return;

    const batches = chunk(events, this.batchSize);

    for (const batch of batches) {
      const entries = batch.map((evt) => this.toEventBridgeEntry(evt));

      try {
        const res = await this.client.putEvents({ Entries: entries });

        const failed = res?.FailedEntryCount ?? 0;
        if (failed > 0) {
          throw new InternalError(
            `EventBridge putEvents reported ${failed} failed entr${failed === 1 ? "y" : "ies"}`,
            ErrorCodes.COMMON_INTERNAL_ERROR,
            {
              failedCount: failed,
              entries: res?.Entries,
            }
          );
        }
      } catch (err) {
        throw mapAwsError(err, "EventBusPortAdapter.publish");
      }
    }
  }

  /**
   * Maps a `DomainEvent` into a single EventBridge entry.
   *
   * The entry `Detail` contains an `EventEnvelope`:
   *   { name: evt.type, meta: { id, ts, traceId, source }, data: evt.payload }
   */
  private toEventBridgeEntry(evt: DomainEvent) {
    const ts = evt.occurredAt as unknown as ISODateString;

    const envelope: EventEnvelope = {
      name: evt.type,
      meta: {
        id: evt.id,
        ts,
        traceId: evt.metadata?.["x-trace-id"],
        source: this.source,
      } as EventEnvelope["meta"],
      data: evt.payload,
    };

    return {
      Source: this.source,
      DetailType: evt.type,
      Detail: stableStringifyUnsafe(envelope),
      EventBusName: this.busName,
      Time: new Date(evt.occurredAt),
      Resources: this.resources,
      TraceHeader: envelope.meta?.traceId,
    };
  }
}
