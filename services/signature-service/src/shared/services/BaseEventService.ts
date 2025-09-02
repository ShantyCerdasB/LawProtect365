/**
 * @file BaseEventService.ts
 * @summary Base abstract class for domain event publishing services
 * @description Provides a common interface for domain event publishing across different modules.
 * Uses the outbox pattern for reliable event delivery.
 */

import type { OutboxPort, DomainEvent } from "@lawprotect/shared-ts";
import type { OutboxRepoCreateInput } from "../types/outbox/OutboxRepositoryTypes";

/**
 * @summary Maps a domain event to outbox input format
 * @description Converts a domain event to the format expected by the outbox repository
 * @param event - Domain event to map
 * @param traceId - Optional trace ID for observability
 * @returns OutboxRepoCreateInput for persistence
 */
const mapDomainEventToOutboxInput = (
  event: DomainEvent, 
  traceId?: string
): OutboxRepoCreateInput => ({
  id: event.id || `event-${Date.now()}`,
  eventType: event.type,
  payload: event.payload as Record<string, unknown> || {},
  occurredAt: event.occurredAt,
  traceId,
});

/**
 * @summary Base abstract class for domain event publishing services
 * @description Provides common event publishing functionality that can be extended
 * by module-specific event services (ConsentEventService, EnvelopeEventService, etc.)
 */
export abstract class BaseEventService {
  constructor(protected readonly outbox: OutboxPort) {}

  /**
   * @summary Publishes a domain event using the outbox pattern
   * @description Saves the event to the outbox for reliable delivery
   * @param event - Domain event to publish
   * @param traceId - Optional trace ID for observability
   */
  async publishDomainEvent(
    event: DomainEvent, 
    traceId?: string
  ): Promise<void> {
    const outboxInput = mapDomainEventToOutboxInput(event, traceId);
         await this.outbox.save({
       id: outboxInput.id,
       type: outboxInput.eventType,
       payload: outboxInput.payload,
       occurredAt: typeof outboxInput.occurredAt === 'string' ? outboxInput.occurredAt : outboxInput.occurredAt.toISOString(),
     }, outboxInput.traceId);
  }

  /**
   * @summary Publishes a module-specific domain event
   * @description Abstract method that each module must implement for its specific events
   * @param event - Module-specific domain event
   * @param traceId - Optional trace ID for observability
   */
  abstract publishModuleEvent(
    event: DomainEvent, 
    traceId?: string
  ): Promise<void>;
}
