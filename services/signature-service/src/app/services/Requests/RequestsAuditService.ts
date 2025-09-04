/**
 * @file RequestsAuditService.ts
 * @summary Audit service for requests operations
 * @description Provides audit logging for all request operations
 */

import { BaseAuditService } from "../../../shared/services/BaseAuditService";
import type { AuditContext } from "../../../domain/entities/AuditContext";

/**
 * @summary Audit service for requests operations
 * @description Extends BaseAuditService to provide request-specific audit logging
 */
export class RequestsAuditService extends BaseAuditService {
  
  /**
   * @summary Log invite parties operation
   */
  async logInviteParties(
    context: AuditContext, 
    details: { envelopeId: string; partyIds: string[]; invited: string[]; alreadyPending: string[]; skipped: string[]; statusChanged: boolean }
  ): Promise<void> {
    await this.logBusinessEvent(context, {
      action: "invite_parties",
      ...details
    });
  }

  /**
   * @summary Log remind parties operation
   */
  async logRemindParties(
    context: AuditContext, 
    details: { envelopeId: string; partyIds?: string[]; reminded: string[]; skipped: string[]; message?: string }
  ): Promise<void> {
    await this.logBusinessEvent(context, {
      action: "remind_parties",
      ...details
    });
  }

  /**
   * @summary Log cancel envelope operation
   */
  async logCancelEnvelope(
    context: AuditContext, 
    details: { envelopeId: string; reason?: string; previousStatus: string; newStatus: string }
  ): Promise<void> {
    await this.logBusinessEvent(context, {
      action: "cancel_envelope",
      ...details
    });
  }

  /**
   * @summary Log decline envelope operation
   */
  async logDeclineEnvelope(
    context: AuditContext, 
    details: { envelopeId: string; reason?: string; previousStatus: string; newStatus: string }
  ): Promise<void> {
    await this.logBusinessEvent(context, {
      action: "decline_envelope",
      ...details
    });
  }

  /**
   * @summary Log finalise envelope operation
   */
  async logFinaliseEnvelope(
    context: AuditContext, 
    details: { envelopeId: string; previousStatus: string; newStatus: string; finalisedAt: string }
  ): Promise<void> {
    await this.logBusinessEvent(context, {
      action: "finalise_envelope",
      ...details
    });
  }

  /**
   * @summary Log request signature operation
   */
  async logRequestSignature(
    context: AuditContext, 
    details: { envelopeId: string; partyIds: string[]; requested: string[]; skipped: string[]; message?: string }
  ): Promise<void> {
    await this.logBusinessEvent(context, {
      action: "request_signature",
      ...details
    });
  }

  /**
   * @summary Log add viewer operation
   */
  async logAddViewer(
    context: AuditContext, 
    details: { envelopeId: string; partyId: string; addedAt: string; message?: string }
  ): Promise<void> {
    await this.logBusinessEvent(context, {
      action: "add_viewer",
      ...details
    });
  }
}
