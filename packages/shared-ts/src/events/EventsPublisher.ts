import type { EventBusPort } from "./EventBusPort.js";
import type { OutboxPort, OutboxRecord } from "./Outbox.js";

/**
 * Publishes pending outbox records and updates their status.
 */
export interface EventPublisher {
  /**
   * Processes a batch of outbox records.
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

      for (const r of items) {
        try {
          // Tu EventBusPort.publish espera un solo envelope:
          await bus.publish({
            id: r.id,
            type: r.type,
            payload: r.payload,
            occurredAt: r.occurredAt,
            headers: r.traceId ? { "x-trace-id": r.traceId } : undefined
          } as any); // si tu tipo Envelope difiere, ajusta las props aquí

          await outbox.markDispatched(r.id);
        } catch (e) {
          await outbox.markFailed(r.id, String((e as Error)?.message ?? e));
        }
      }
    }
  };
};
