/**
 * @file RequestsAuditService.ts
 * @summary Audit service for requests operations
 * @description Provides audit logging for all request operations
 */

import { BaseAuditService } from "../../../domain/services/BaseAuditService";
import type { AuditContext } from "@lawprotect/shared-ts";
import type { RequestsAuditService } from "../../../domain/types/requests/ServiceInterfaces";
import type { PartyId, EnvelopeId, TenantId } from "@/domain/value-objects/ids";
import type { ActorContext } from "@lawprotect/shared-ts";
import { nowIso } from "@lawprotect/shared-ts";

/**
 * @summary Audit service for requests operations
 * @description Extends BaseAuditService to provide request-specific audit logging
 */
export class DefaultRequestsAuditService extends BaseAuditService implements RequestsAuditService {
  
  /**
   * @summary Logs a business event for audit purposes
   * @description Implementation of the abstract method from BaseAuditService
   * @param context - Audit context containing tenant, envelope, and actor information
   * @param details - Module-specific audit details
   */
  async logBusinessEvent(
    context: AuditContext, 
    details: Record<string, unknown>
  ): Promise<void> {
    if (!context.envelopeId) {
      // For Requests, we always need an envelope context
      return;
    }

    await this.auditRepo.record({
      tenantId: context.tenantId,
      envelopeId: context.envelopeId as EnvelopeId,
      type: details.eventType as string,
      occurredAt: nowIso(),
      actor: context.actor,
      metadata: details,
    });
  }
  
  /**
   * @summary Log invite parties operation
   */
  async logInviteParties(partyIds: PartyId[], envelopeId: EnvelopeId, tenantId: TenantId, actor: ActorContext): Promise<void> {
    await this.logBusinessEvent({
      tenantId,
      envelopeId,
      actor,
    }, {
      eventType: "requests.invite_parties",
      partyIds,
    });
  }

  /**
   * @summary Log remind parties operation
   */
  async logRemindParties(partyIds: PartyId[], envelopeId: EnvelopeId, tenantId: TenantId, actor: ActorContext): Promise<void> {
    await this.logBusinessEvent({
      tenantId,
      envelopeId,
      actor,
    }, {
      eventType: "requests.remind_parties",
      partyIds,
    });
  }

  /**
   * @summary Log cancel envelope operation
   */
  async logCancelEnvelope(envelopeId: EnvelopeId, tenantId: TenantId, actor: ActorContext): Promise<void> {
    await this.logBusinessEvent({
      tenantId,
      envelopeId,
      actor,
    }, {
      eventType: "requests.cancel_envelope",
    });
  }

  /**
   * @summary Log decline envelope operation
   */
  async logDeclineEnvelope(envelopeId: EnvelopeId, tenantId: TenantId, actor: ActorContext): Promise<void> {
    await this.logBusinessEvent({
      tenantId,
      envelopeId,
      actor,
    }, {
      eventType: "requests.decline_envelope",
    });
  }

  /**
   * @summary Log finalise envelope operation
   */
  async logFinaliseEnvelope(envelopeId: EnvelopeId, tenantId: TenantId, actor: ActorContext): Promise<void> {
    await this.logBusinessEvent({
      tenantId,
      envelopeId,
      actor,
    }, {
      eventType: "requests.finalise_envelope",
    });
  }

  /**
   * @summary Log request signature operation
   */
  async logRequestSignature(partyId: PartyId, envelopeId: EnvelopeId, tenantId: TenantId, actor: ActorContext): Promise<void> {
    await this.logBusinessEvent({
      tenantId,
      envelopeId,
      actor,
    }, {
      eventType: "requests.request_signature",
      partyId,
    });
  }

  /**
   * @summary Log add viewer operation
   */
  async logAddViewer(partyId: PartyId, envelopeId: EnvelopeId, tenantId: TenantId, actor: ActorContext): Promise<void> {
    await this.logBusinessEvent({
      tenantId,
      envelopeId,
      actor,
    }, {
      eventType: "requests.add_viewer",
      partyId,
    });
  }
}






