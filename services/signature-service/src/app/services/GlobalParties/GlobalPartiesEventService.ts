/**
 * @file GlobalPartiesEventService.ts
 * @summary Event service for Global Parties domain events
 * @description Handles publishing of Global Party-related domain events using the outbox pattern.
 * Extends BaseEventService to provide Global Party-specific event publishing functionality.
 */

import { BaseEventService } from "../../../domain/services/BaseEventService";
import type { DomainEvent } from "@lawprotect/shared-ts";
import type { TenantId, PartyId } from "@/domain/value-objects/ids";
import type { ActorContext } from "@lawprotect/shared-ts";

/**
 * @summary Event service for Global Parties domain events
 * @description Extends BaseEventService to provide Global Party-specific event publishing functionality.
 * Uses the outbox pattern for reliable event delivery.
 */
export class GlobalPartiesEventService extends BaseEventService {
  /**
   * @summary Publishes a Global Party created domain event
   * @description Publishes a Global Party creation event using the outbox pattern
   * @param partyId - Global Party identifier
   * @param tenantId - Tenant identifier
   * @param actor - Actor context for audit purposes
   * @param traceId - Optional trace ID for observability
   */
  async publishGlobalPartyCreatedEvent(
    partyId: PartyId,
    tenantId: TenantId,
    actor: ActorContext,
    traceId?: string
  ): Promise<void> {
    await this.publishStandardizedEvent(
      "global_party.created",
      { partyId, tenantId },
      actor,
      traceId
    );
  }

  /**
   * @summary Publishes a Global Party updated domain event
   * @description Publishes a Global Party update event using the outbox pattern
   * @param partyId - Global Party identifier
   * @param tenantId - Tenant identifier
   * @param updatedFields - Fields that were updated
   * @param actor - Actor context for audit purposes
   * @param traceId - Optional trace ID for observability
   */
  async publishGlobalPartyUpdatedEvent(
    partyId: PartyId,
    tenantId: TenantId,
    updatedFields: Record<string, unknown>,
    actor: ActorContext,
    traceId?: string
  ): Promise<void> {
    await this.publishStandardizedEvent(
      "global_party.updated",
      { partyId, tenantId, updatedFields },
      actor,
      traceId
    );
  }

  /**
   * @summary Publishes a Global Party deleted domain event
   * @description Publishes a Global Party deletion event using the outbox pattern
   * @param partyId - Global Party identifier
   * @param tenantId - Tenant identifier
   * @param actor - Actor context for audit purposes
   * @param traceId - Optional trace ID for observability
   */
  async publishGlobalPartyDeletedEvent(
    partyId: PartyId,
    tenantId: TenantId,
    actor: ActorContext,
    traceId?: string
  ): Promise<void> {
    await this.publishStandardizedEvent(
      "global_party.deleted",
      { partyId, tenantId },
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
  async publishCreated(partyId: PartyId, tenantId: TenantId, actor: ActorContext): Promise<void> {
    await this.publishGlobalPartyCreatedEvent(partyId, tenantId, actor);
  }

  async publishUpdated(partyId: PartyId, tenantId: TenantId, actor: ActorContext): Promise<void> {
    await this.publishGlobalPartyUpdatedEvent(partyId, tenantId, {}, actor);
  }

  async publishDeleted(partyId: PartyId, tenantId: TenantId, actor: ActorContext): Promise<void> {
    await this.publishGlobalPartyDeletedEvent(partyId, tenantId, actor);
  }
}






