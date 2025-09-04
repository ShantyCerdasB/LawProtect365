/**
 * @file RequestsEventService.ts
 * @summary Event service for requests operations
 * @description Provides event publishing for all request operations
 */

import { BaseEventService } from "../../../shared/services/BaseEventService";
import { makeEvent, DomainEvent } from "@lawprotect/shared-ts";
import type { AuditContext } from "../../../domain/entities/AuditContext";

/**
 * @summary Event service for requests operations
 * @description Extends BaseEventService to provide request-specific event publishing
 */
export class RequestsEventService extends BaseEventService {
  
  /**
   * @summary Publish invite parties event
   */
  async publishInviteParties(
    context: AuditContext, 
    details: { envelopeId: string; partyIds: string[]; invited: string[]; alreadyPending: string[]; skipped: string[]; statusChanged: boolean }
  ): Promise<void> {
    const event = makeEvent("envelope.parties.invited", {
      envelopeId: details.envelopeId,
      partyIds: details.partyIds,
      invited: details.invited,
      alreadyPending: details.alreadyPending,
      skipped: details.skipped,
      statusChanged: details.statusChanged,
      tenantId: context.tenantId,
      actor: context.actor
    });
    
    await this.publishEvent(event);
  }

  /**
   * @summary Publish remind parties event
   */
  async publishRemindParties(
    context: AuditContext, 
    details: { envelopeId: string; partyIds?: string[]; reminded: string[]; skipped: string[]; message?: string }
  ): Promise<void> {
    const event = makeEvent("envelope.parties.reminded", {
      envelopeId: details.envelopeId,
      partyIds: details.partyIds,
      reminded: details.reminded,
      skipped: details.skipped,
      message: details.message,
      tenantId: context.tenantId,
      actor: context.actor
    });
    
    await this.publishEvent(event);
  }

  /**
   * @summary Publish cancel envelope event
   */
  async publishCancelEnvelope(
    context: AuditContext, 
    details: { envelopeId: string; reason?: string; previousStatus: string; newStatus: string }
  ): Promise<void> {
    const event = makeEvent("envelope.cancelled", {
      envelopeId: details.envelopeId,
      reason: details.reason,
      previousStatus: details.previousStatus,
      newStatus: details.newStatus,
      tenantId: context.tenantId,
      actor: context.actor
    });
    
    await this.publishEvent(event);
  }

  /**
   * @summary Publish decline envelope event
   */
  async publishDeclineEnvelope(
    context: AuditContext, 
    details: { envelopeId: string; reason?: string; previousStatus: string; newStatus: string }
  ): Promise<void> {
    const event = makeEvent("envelope.declined", {
      envelopeId: details.envelopeId,
      reason: details.reason,
      previousStatus: details.previousStatus,
      newStatus: details.newStatus,
      tenantId: context.tenantId,
      actor: context.actor
    });
    
    await this.publishEvent(event);
  }

  /**
   * @summary Publish finalise envelope event
   */
  async publishFinaliseEnvelope(
    context: AuditContext, 
    details: { envelopeId: string; previousStatus: string; newStatus: string; finalisedAt: string }
  ): Promise<void> {
    const event = makeEvent("envelope.finalised", {
      envelopeId: details.envelopeId,
      previousStatus: details.previousStatus,
      newStatus: details.newStatus,
      finalisedAt: details.finalisedAt,
      tenantId: context.tenantId,
      actor: context.actor
    });
    
    await this.publishEvent(event);
  }

  /**
   * @summary Publish request signature event
   */
  async publishRequestSignature(
    context: AuditContext, 
    details: { envelopeId: string; partyIds: string[]; requested: string[]; skipped: string[]; message?: string }
  ): Promise<void> {
    const event = makeEvent("envelope.signature.requested", {
      envelopeId: details.envelopeId,
      partyIds: details.partyIds,
      requested: details.requested,
      skipped: details.skipped,
      message: details.message,
      tenantId: context.tenantId,
      actor: context.actor
    });
    
    await this.publishEvent(event);
  }

  /**
   * @summary Publish add viewer event
   */
  async publishAddViewer(
    context: AuditContext, 
    details: { envelopeId: string; partyId: string; addedAt: string; message?: string }
  ): Promise<void> {
    const event = makeEvent("envelope.viewer.added", {
      envelopeId: details.envelopeId,
      partyId: details.partyId,
      addedAt: details.addedAt,
      message: details.message,
      tenantId: context.tenantId,
      actor: context.actor
    });
    
    await this.publishEvent(event);
  }
}
