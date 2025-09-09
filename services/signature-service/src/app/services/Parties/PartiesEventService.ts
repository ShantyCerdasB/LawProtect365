/**
 * @file PartiesEventService.ts
 * @summary Event service for Parties domain events
 * @description Handles publishing of Party-related domain events using the outbox pattern.
 * Extends BaseEventService to provide Party-specific event publishing functionality.
 */

import { BaseEventService } from "../../../domain/services/BaseEventService";
import type { DomainEvent } from "@lawprotect/shared-ts";
import { makeEvent } from "@lawprotect/shared-ts";
import type { PartyId, EnvelopeId, TenantId } from "@/domain/value-objects/ids";
import type { ActorContext } from "@lawprotect/shared-ts";

/**
 * @summary Event service for Parties domain events
 * @description Extends BaseEventService to provide Party-specific event publishing functionality.
 * Uses the outbox pattern for reliable event delivery.
 */
export class PartiesEventService extends BaseEventService {
  /**
   * @summary Publishes a Party created domain event
   * @description Publishes a Party creation event using the outbox pattern
   * @param partyId - Party identifier
   * @param tenantId - Tenant identifier
   * @param envelopeId - Envelope identifier
   * @param actor - Actor context for audit purposes
   * @param traceId - Optional trace ID for observability
   */
  async publishPartyCreatedEvent(
    partyId: PartyId,
    tenantId: TenantId,
    envelopeId: EnvelopeId,
    actor: ActorContext,
    traceId?: string
  ): Promise<void> {
    const domainEvent: DomainEvent = makeEvent(
      "party.created",
      {
        partyId,
        tenantId,
        envelopeId,
        actor: {
          userId: actor.userId,
          email: actor.email,
          ip: actor.ip,
          userAgent: actor.userAgent,
          role: actor.role,
        },
        occurredAt: new Date().toISOString(),
      },
      traceId ? { "x-trace-id": traceId } : undefined
    );
    
    await this.publishDomainEvent(domainEvent, traceId);
  }

  /**
   * @summary Publishes a Party updated domain event
   * @description Publishes a Party update event using the outbox pattern
   * @param partyId - Party identifier
   * @param tenantId - Tenant identifier
   * @param envelopeId - Envelope identifier
   * @param updatedFields - Fields that were updated
   * @param actor - Actor context for audit purposes
   * @param traceId - Optional trace ID for observability
   */
  async publishPartyUpdatedEvent(
    partyId: PartyId,
    tenantId: TenantId,
    envelopeId: EnvelopeId,
    updatedFields: Record<string, unknown>,
    actor: ActorContext,
    traceId?: string
  ): Promise<void> {
    const domainEvent: DomainEvent = makeEvent(
      "party.updated",
      {
        partyId,
        tenantId,
        envelopeId,
        updatedFields,
        actor: {
          userId: actor.userId,
          email: actor.email,
          ip: actor.ip,
          userAgent: actor.userAgent,
          role: actor.role,
        },
        occurredAt: new Date().toISOString(),
      },
      traceId ? { "x-trace-id": traceId } : undefined
    );
    
    await this.publishDomainEvent(domainEvent, traceId);
  }

  /**
   * @summary Publishes a Party deleted domain event
   * @description Publishes a Party deletion event using the outbox pattern
   * @param partyId - Party identifier
   * @param tenantId - Tenant identifier
   * @param envelopeId - Envelope identifier
   * @param actor - Actor context for audit purposes
   * @param traceId - Optional trace ID for observability
   */
  async publishPartyDeletedEvent(
    partyId: PartyId,
    tenantId: TenantId,
    envelopeId: EnvelopeId,
    actor: ActorContext,
    traceId?: string
  ): Promise<void> {
    await this.publishStandardizedEvent(
      "party.deleted",
      { partyId, tenantId, envelopeId },
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
}






