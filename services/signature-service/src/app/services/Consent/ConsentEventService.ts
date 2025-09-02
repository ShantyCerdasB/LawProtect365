/**
 * @file ConsentEventService.ts
 * @summary Event service for consent domain events
 * @description Handles publishing of consent-related domain events using the outbox pattern.
 * Extends BaseEventService to provide consent-specific event publishing functionality.
 */

import { ConsentDelegatedEvent } from "../../../domain/entities/ConsentDelegatedEvent";
import { BaseEventService } from "../../../shared/services/BaseEventService";
import type { DomainEvent } from "@lawprotect/shared-ts";
import { makeEvent } from "@lawprotect/shared-ts";

/**
 * @summary Event service for consent domain events
 * @description Extends BaseEventService to provide consent-specific event publishing functionality.
 * Uses the outbox pattern for reliable event delivery.
 */
export class ConsentEventService extends BaseEventService {
  /**
   * @summary Publishes a consent delegated domain event
   * @description Publishes a consent delegation event using the outbox pattern
   * @param event - Consent delegated event to publish
   * @param traceId - Optional trace ID for observability
   */
  async publishConsentDelegatedEvent(
    event: ConsentDelegatedEvent,
    traceId?: string
  ): Promise<void> {
    const domainEvent: DomainEvent = makeEvent(
      event.type,
      event.payload,
      traceId ? { "x-trace-id": traceId } : undefined
    );
    
    await this.publishDomainEvent(domainEvent, traceId);
  }

  /**
   * @summary Publishes a module-specific domain event
   * @description Implementation of the abstract method from BaseEventService
   * @param event - Module-specific domain event
   * @param traceId - Optional trace ID for observability
   */
  async publishModuleEvent(
    event: DomainEvent,
    traceId?: string
  ): Promise<void> {
    await this.publishDomainEvent(event, traceId);
  }
}
