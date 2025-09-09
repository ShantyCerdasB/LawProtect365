/**
 * @file RequestsEventService.ts
 * @summary Event service for requests operations
 * @description Provides event publishing for all request operations
 */

import { BaseEventService } from "../../../domain/services/BaseEventService";
import { makeEvent, DomainEvent } from "@lawprotect/shared-ts";
import type { RequestsEventService as IRequestsEventService } from "../../../domain/types/requests/ServiceInterfaces";
import type { PartyId, EnvelopeId, TenantId } from "@/domain/value-objects/ids";
import type { ActorContext } from "@lawprotect/shared-ts";

/**
 * @summary Event service for requests operations
 * @description Extends BaseEventService to provide request-specific event publishing
 */
export class RequestsEventService extends BaseEventService implements IRequestsEventService {
  
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
  
  /**
   * @summary Publish invite parties event
   */
  async publishInviteParties(partyIds: PartyId[], envelopeId: EnvelopeId, tenantId: TenantId, actor: ActorContext): Promise<void> {
    const event = makeEvent("requests.invite_parties", {
      partyIds,
      envelopeId,
      tenantId,
      actor: {
        userId: actor.userId,
        email: actor.email,
        ip: actor.ip,
        userAgent: actor.userAgent,
        role: actor.role,
      },
      occurredAt: new Date().toISOString(),
    });
    
    await this.publishModuleEvent(event);
  }

  /**
   * @summary Publish remind parties event
   */
  async publishRemindParties(partyIds: PartyId[], envelopeId: EnvelopeId, tenantId: TenantId, actor: ActorContext): Promise<void> {
    const event = makeEvent("requests.remind_parties", {
      partyIds,
      envelopeId,
      tenantId,
      actor: {
        userId: actor.userId,
        email: actor.email,
        ip: actor.ip,
        userAgent: actor.userAgent,
        role: actor.role,
      },
      occurredAt: new Date().toISOString(),
    });
    
    await this.publishModuleEvent(event);
  }

  /**
   * @summary Publish cancel envelope event
   */
  async publishCancelEnvelope(envelopeId: EnvelopeId, tenantId: TenantId, actor: ActorContext): Promise<void> {
    const event = makeEvent("requests.cancel_envelope", {
      envelopeId,
      tenantId,
      actor: {
        userId: actor.userId,
        email: actor.email,
        ip: actor.ip,
        userAgent: actor.userAgent,
        role: actor.role,
      },
      occurredAt: new Date().toISOString(),
    });
    
    await this.publishModuleEvent(event);
  }

  /**
   * @summary Publish decline envelope event
   */
  async publishDeclineEnvelope(envelopeId: EnvelopeId, tenantId: TenantId, actor: ActorContext): Promise<void> {
    const event = makeEvent("requests.decline_envelope", {
      envelopeId,
      tenantId,
      actor: {
        userId: actor.userId,
        email: actor.email,
        ip: actor.ip,
        userAgent: actor.userAgent,
        role: actor.role,
      },
      occurredAt: new Date().toISOString(),
    });
    
    await this.publishModuleEvent(event);
  }

  /**
   * @summary Publish finalise envelope event
   */
  async publishFinaliseEnvelope(envelopeId: EnvelopeId, tenantId: TenantId, actor: ActorContext): Promise<void> {
    const event = makeEvent("requests.finalise_envelope", {
      envelopeId,
      tenantId,
      actor: {
        userId: actor.userId,
        email: actor.email,
        ip: actor.ip,
        userAgent: actor.userAgent,
        role: actor.role,
      },
      occurredAt: new Date().toISOString(),
    });
    
    await this.publishModuleEvent(event);
  }

  /**
   * @summary Publish request signature event
   */
  async publishRequestSignature(partyId: PartyId, envelopeId: EnvelopeId, tenantId: TenantId, actor: ActorContext): Promise<void> {
    const event = makeEvent("requests.request_signature", {
      partyId,
      envelopeId,
      tenantId,
      actor: {
        userId: actor.userId,
        email: actor.email,
        ip: actor.ip,
        userAgent: actor.userAgent,
        role: actor.role,
      },
      occurredAt: new Date().toISOString(),
    });
    
    await this.publishModuleEvent(event);
  }

  /**
   * @summary Publish add viewer event
   */
  async publishAddViewer(partyId: PartyId, envelopeId: EnvelopeId, tenantId: TenantId, actor: ActorContext): Promise<void> {
    const event = makeEvent("requests.add_viewer", {
      partyId,
      envelopeId,
      tenantId,
      actor: {
        userId: actor.userId,
        email: actor.email,
        ip: actor.ip,
        userAgent: actor.userAgent,
        role: actor.role,
      },
      occurredAt: new Date().toISOString(),
    });
    
    await this.publishModuleEvent(event);
  }
};
