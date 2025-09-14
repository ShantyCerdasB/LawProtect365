/**
 * @file GlobalPartiesEventService.ts
 * @summary Event service for Global Parties domain events
 * @description Handles publishing of Global Party-related domain events using the outbox pattern.
 * Extends BaseEventService to provide Global Party-specific event publishing functionality.
 */

import { BaseEventService } from "../../../domain/services/BaseEventService";
import type { DomainEvent, ActorContext } from "@lawprotect/shared-ts";
import type { PartyId } from "@/domain/value-objects/ids";

/**
 * @summary Event service for Global Parties domain events
 * @description Extends BaseEventService to provide Global Party-specific event publishing functionality.
 * Uses the outbox pattern for reliable event delivery.
 */
export class GlobalPartiesEventService extends BaseEventService {
  /**
   * @summary Publishes a Global Party created domain event
   * @description Publishes a Global Party creation event using the outbox pattern
   * @param partyId - Global Party identifier   * @param actor - Actor context for audit purposes
   * @param traceId - Optional trace ID for observability
   */
  async publishGlobalPartyCreatedEvent(
    partyId: PartyId,
    actor: ActorContext,
    traceId?: string
  ): Promise<void> {
    await this.publishStandardizedEvent(
      "global_party.created",
      { partyId},
      actor,
      traceId
    );
  }

  /**
   * @summary Publishes a Global Party updated domain event
   * @description Publishes a Global Party update event using the outbox pattern
   * @param partyId - Global Party identifier   * @param updatedFields - Fields that were updated
   * @param actor - Actor context for audit purposes
   * @param traceId - Optional trace ID for observability
   */
  async publishGlobalPartyUpdatedEvent(
    partyId: PartyId,
    updatedFields: Record<string, unknown>,
    actor: ActorContext,
    traceId?: string
  ): Promise<void> {
    await this.publishStandardizedEvent(
      "global_party.updated",
      { partyId, updatedFields },
      actor,
      traceId
    );
  }

  /**
   * @summary Publishes a Global Party deleted domain event
   * @description Publishes a Global Party deletion event using the outbox pattern
   * @param partyId - Global Party identifier   * @param actor - Actor context for audit purposes
   * @param traceId - Optional trace ID for observability
   */
  async publishGlobalPartyDeletedEvent(
    partyId: PartyId,
    actor: ActorContext,
    traceId?: string
  ): Promise<void> {
    await this.publishStandardizedEvent(
      "global_party.deleted",
      { partyId},
      actor,
      traceId
    );
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

  // Implementation of GlobalPartiesEventService interface methods
  async publishCreated(partyId: PartyId, actor: ActorContext): Promise<void> {
    await this.publishGlobalPartyCreatedEvent(partyId, actor);
  }

  async publishUpdated(partyId: PartyId, actor: ActorContext): Promise<void> {
    await this.publishGlobalPartyUpdatedEvent(partyId, {}, actor);
  }

  async publishDeleted(partyId: PartyId, actor: ActorContext): Promise<void> {
    await this.publishGlobalPartyDeletedEvent(partyId, actor);
  }
};
