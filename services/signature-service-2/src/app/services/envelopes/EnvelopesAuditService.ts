/**
 * @file EnvelopesAuditService.ts
 * @summary Audit service for envelope operations
 * @description Logs envelope operations for compliance and tracking
 */

import { BaseAuditService } from "../../../domain/services/BaseAuditService";
import type { EnvelopeId, UserId } from "../../../domain/value-objects/ids";
import type { EnvelopeStatus } from "../../../domain/value-objects/index";
import type { Envelope } from "../../../domain/entities/Envelope";
import type { AuditContext } from "@lawprotect/shared-ts";

/**
 * @summary Audit service for envelope operations
 * @description Extends BaseAuditService to provide envelope-specific audit logging
 */
export class EnvelopesAuditService extends BaseAuditService {
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
      // For envelope operations, we always need an envelope context
      return;
    }

    await this.auditRepo.record({
      envelopeId: context.envelopeId as EnvelopeId,
      type: details.eventType as string,
      occurredAt: new Date().toISOString(),
      actor: context.actor,
      metadata: details});
  }

  /**
   * @summary Logs envelope creation
   * @param context - Audit context
   * @param details - Envelope creation details
   */
  async logCreate(context: { actor: { userId: UserId; email: string } }, details: { envelopeId: EnvelopeId; name: string; ownerEmail: string }): Promise<void> {
    const auditContext = this.createAuditContext(
      details.envelopeId,
      { userId: context.actor.userId, email: context.actor.email }
    );
    
    await this.logBusinessEvent(auditContext, {
      eventType: "envelope.created",
      envelopeId: details.envelopeId,
      name: details.name,
      ownerEmail: details.ownerEmail
    });
  }

  /**
   * @summary Logs envelope update
   * @param context - Audit context
   * @param details - Envelope update details
   */
  async logUpdate(context: { actor: { userId: UserId; email: string } }, details: { envelopeId: EnvelopeId; changes: Partial<Envelope>; previousStatus?: EnvelopeStatus }): Promise<void> {
    const auditContext = this.createAuditContext(
      details.envelopeId,
      { userId: context.actor.userId, email: context.actor.email }
    );
    
    await this.logBusinessEvent(auditContext, {
      eventType: "envelope.updated",
      envelopeId: details.envelopeId,
      changes: details.changes,
      previousStatus: details.previousStatus
    });
  }

  /**
   * @summary Logs envelope deletion
   * @param context - Audit context
   * @param details - Envelope deletion details
   */
  async logDelete(context: { actor: { userId: UserId; email: string } }, details: { envelopeId: EnvelopeId; name: string; status: EnvelopeStatus }): Promise<void> {
    const auditContext = this.createAuditContext(
      details.envelopeId,
      { userId: context.actor.userId, email: context.actor.email }
    );
    
    await this.logBusinessEvent(auditContext, {
      eventType: "envelope.deleted",
      envelopeId: details.envelopeId,
      name: details.name,
      status: details.status
    });
  }

  /**
   * @summary Logs envelope status change
   * @param context - Audit context
   * @param details - Status change details
   */
  async logStatusChange(context: { actor: { userId: UserId; email: string } }, details: { envelopeId: EnvelopeId; previousStatus: EnvelopeStatus; newStatus: EnvelopeStatus; reason?: string }): Promise<void> {
    const auditContext = this.createAuditContext(
      details.envelopeId,
      { userId: context.actor.userId, email: context.actor.email }
    );
    
    await this.logBusinessEvent(auditContext, {
      eventType: "envelope.status_changed",
      envelopeId: details.envelopeId,
      previousStatus: details.previousStatus,
      newStatus: details.newStatus,
      reason: details.reason
    });
  }

  /**
   * @summary Logs envelope party addition
   * @param context - Audit context
   * @param details - Party addition details
   */
  async logPartyAdded(context: { actor: { userId: UserId; email: string } }, details: { envelopeId: EnvelopeId; partyId: string; role: string }): Promise<void> {
    const auditContext = this.createAuditContext(
      details.envelopeId,
      { userId: context.actor.userId, email: context.actor.email }
    );
    
    await this.logBusinessEvent(auditContext, {
      eventType: "envelope.party_added",
      envelopeId: details.envelopeId,
      partyId: details.partyId,
      role: details.role
    });
  }

  /**
   * @summary Logs envelope document addition
   * @param context - Audit context
   * @param details - Document addition details
   */
  async logDocumentAdded(context: { actor: { userId: UserId; email: string } }, details: { envelopeId: EnvelopeId; documentId: string; documentName: string }): Promise<void> {
    const auditContext = this.createAuditContext(
      details.envelopeId,
      { userId: context.actor.userId, email: context.actor.email }
    );
    
    await this.logBusinessEvent(auditContext, {
      eventType: "envelope.document_added",
      envelopeId: details.envelopeId,
      documentId: details.documentId,
      documentName: details.documentName
    });
  }

  /**
   * @summary Logs envelope access by ID
   * @param context - Audit context
   * @param details - Get envelope details
   */
  async logGetById(context: AuditContext, details: { envelopeId: EnvelopeId }): Promise<void> {
    await this.logBusinessEvent(context, {
      eventType: "envelope.accessed",
      envelopeId: details.envelopeId,
      operation: "getById"
    });
  }

  /**
   * @summary Logs envelope list access
   * @param context - Audit context
   * @param details - List envelopes details
   */
  async logList(context: AuditContext, details: { limit?: number; cursor?: string; resultCount: number }): Promise<void> {
    await this.logBusinessEvent(context, {
      eventType: "envelope.list_accessed",
      operation: "list",
      limit: details.limit,
      cursor: details.cursor,
      resultCount: details.resultCount
    });
  }

  /**
   * @summary Logs envelope status access
   * @param context - Audit context
   * @param details - Get envelope status details
   */
  async logGetStatus(context: AuditContext, details: { envelopeId: EnvelopeId; status: EnvelopeStatus }): Promise<void> {
    await this.logBusinessEvent(context, {
      eventType: "envelope.status_accessed",
      envelopeId: details.envelopeId,
      status: details.status,
      operation: "getStatus"
    });
  }
};
