
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
  chunk,
} from "@lawprotect/shared-ts";

import { EventBridgeClientPort } from "../../shared/contracts/eventbridge/EventBridgeClientPort";
import type { EventBusPortAdapterOptions } from "../../shared/types/eventbridge/EventBusPortAdapterOptions";

/**
 * Adapter that publishes domain events to EventBridge, implementing `EventBusPort`.
 */
export class EventBusPortAdapter implements EventBusPort {
  private readonly busName: string;
  private readonly source: string;
  private readonly client: EventBridgeClientPort;
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
   * Simplified mapping: directly serialize the DomainEvent payload
   * without creating a custom EventEnvelope wrapper.
   */
  private toEventBridgeEntry(evt: DomainEvent) {
    return {
      Source: this.source,
      DetailType: evt.type,
      Detail: stableStringifyUnsafe(evt.payload),
      EventBusName: this.busName,
      Time: new Date(evt.occurredAt),
      Resources: this.resources,
      TraceHeader: evt.metadata?.["x-trace-id"],
    };
  }
}
