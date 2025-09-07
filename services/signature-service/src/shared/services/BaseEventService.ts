/**
 * @file BaseEventService.ts
 * @summary Base abstract class for domain event publishing services
 * @description Provides a common interface for domain event publishing across different modules.
 * Uses the outbox pattern for reliable event delivery.
 */

import type { OutboxPort, DomainEvent } from "@lawprotect/shared-ts";
import { makeEvent } from "@lawprotect/shared-ts";
import type { OutboxRepoCreateInput } from "../types/outbox/OutboxRepositoryTypes";
import type { ActorContext } from "../../domain/entities/ActorContext";

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
 * @summary Creates a standardized actor object from ActorContext
 * @description Extracts and formats actor information for domain events
 * @param actor - Actor context containing user information
 * @returns Standardized actor object for events
 */
const createEventActor = (actor: ActorContext) => ({
  userId: actor.userId,
  email: actor.email,
  ip: actor.ip,
  userAgent: actor.userAgent,
  role: actor.role,
});

/**
 * @summary Creates trace headers for domain events
 * @description Formats trace ID into headers object for event metadata
 * @param traceId - Optional trace ID for observability
 * @returns Headers object with trace ID or undefined
 */
const createTraceHeaders = (traceId?: string) => 
  traceId ? { "x-trace-id": traceId } : undefined;

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
   * @summary Creates a domain event with standardized actor and metadata
   * @description Helper method to create domain events with consistent actor formatting
   * @param eventType - Type of the domain event
   * @param payload - Event-specific payload data
   * @param actor - Actor context for audit purposes
   * @param traceId - Optional trace ID for observability
   * @returns Domain event ready for publishing
   */
  protected createDomainEvent(
    eventType: string,
    payload: Record<string, unknown>,
    actor: ActorContext,
    traceId?: string
  ): DomainEvent {
    return makeEvent(
      eventType,
      {
        ...payload,
        actor: createEventActor(actor),
        occurredAt: new Date().toISOString(),
      },
      createTraceHeaders(traceId)
    );
  }

  /**
   * @summary Publishes a domain event with standardized actor and metadata
   * @description Convenience method that creates and publishes a domain event in one call
   * @param eventType - Type of the domain event
   * @param payload - Event-specific payload data
   * @param actor - Actor context for audit purposes
   * @param traceId - Optional trace ID for observability
   */
  protected async publishStandardizedEvent(
    eventType: string,
    payload: Record<string, unknown>,
    actor: ActorContext,
    traceId?: string
  ): Promise<void> {
    const domainEvent = this.createDomainEvent(eventType, payload, actor, traceId);
    await this.publishDomainEvent(domainEvent, traceId);
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
