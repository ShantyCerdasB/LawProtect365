import type { EventBusPort } from "./EventBusPort.js";
import type { OutboxPort, OutboxRecord } from "./Outbox.js";
import type { DomainEvent } from "./DomainEvent.js";

/**
 * Publishes pending outbox records and updates their status.
 */
export interface EventPublisher {
  /**
   * Processes up to `maxBatch` outbox records.
   * Implementations should be safe for at-least-once delivery.
   * @param maxBatch Maximum records to process.
   */
  dispatch(maxBatch: number): Promise<void>;
}

/**
 * Factory that creates an EventPublisher from ports.
 * @param bus Event bus adapter.
 * @param outbox Outbox adapter.
 */
export const makeEventPublisher = (bus: EventBusPort, outbox: OutboxPort): EventPublisher => {
  return {
    async dispatch(maxBatch: number): Promise<void> {
      const items: OutboxRecord[] = await outbox.pullPending(maxBatch);
      if (!items.length) return;

      for (const r of items) {
        // Map OutboxRecord → DomainEvent
        const evt: DomainEvent = {
          id: r.id,
          type: r.type,
          occurredAt: r.occurredAt,
          payload: r.payload,
          metadata: r.traceId ? { "x-trace-id": r.traceId } : undefined,
        };

        try {
          // Port expects an array
          await bus.publish([evt]);
          await outbox.markDispatched(r.id);
        } catch (e) {
          await outbox.markFailed(r.id, String((e as Error)?.message ?? e));
        }
      }
    },
  };
};
