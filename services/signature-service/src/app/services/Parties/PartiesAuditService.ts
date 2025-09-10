/**
 * @file PartiesAuditService.ts
 * @summary Audit service for Party operations
 * @description Handles audit logging for party create, update, and delete operations.
 * Extends BaseAuditService to provide Party-specific audit functionality.
 */

import { BaseAuditService } from "../../../domain/services/BaseAuditService";
import type { AuditContext } from "@lawprotect/shared-ts";
import type { PartyId, EnvelopeId } from "@/domain/value-objects/ids";
import { nowIso } from "@lawprotect/shared-ts";

/**
 * @summary Audit service for Parties business logic
 * @description Extends BaseAuditService to provide Party-specific audit logging functionality.
 * This service is different from Audit Application Services - it's for business logic audit logging.
 */
export class PartiesAuditService extends BaseAuditService {
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
      // For envelope-scoped Parties, we always need an envelope context
      return;
    }

    await this.auditRepo.record({
      envelopeId: context.envelopeId as EnvelopeId,
      type: details.eventType as string,
      occurredAt: nowIso(),
      actor: context.actor,
      metadata: details});
  }

  /**
   * @summary Logs a Party creation event for audit purposes
   * @description Records Party creation in the audit trail for compliance and traceability
   * @param context - Audit context containing tenant, envelope, and actor information
   * @param partyId - Party identifier
   * @param details - Additional creation details
   */
  async logPartyCreated(
    context: AuditContext,
    partyId: PartyId,
    details: Record<string, unknown> = {}
  ): Promise<void> {
    await this.logBusinessEvent(context, {
      eventType: "party.created",
      partyId,
      ...details});
  }

  /**
   * @summary Logs a Party update event for audit purposes
   * @description Records Party updates in the audit trail
   * @param context - Audit context containing tenant, envelope, and actor information
   * @param partyId - Party identifier
   * @param details - Update details including previous and new values
   */
  async logPartyUpdated(
    context: AuditContext,
    partyId: PartyId,
    details: Record<string, unknown> = {}
  ): Promise<void> {
    await this.logBusinessEvent(context, {
      eventType: "party.updated",
      partyId,
      ...details});
  }

  /**
   * @summary Logs a Party deletion event for audit purposes
   * @description Records Party deletion in the audit trail
   * @param context - Audit context containing tenant, envelope, and actor information
   * @param partyId - Party identifier
   * @param details - Deletion details
   */
  async logPartyDeleted(
    context: AuditContext,
    partyId: PartyId,
    details: Record<string, unknown> = {}
  ): Promise<void> {
    await this.logBusinessEvent(context, {
      eventType: "party.deleted",
      partyId,
      ...details});
  }

  // Implementation of PartiesAuditService interface methods
  async logCreate(auditContext: AuditContext, input: any): Promise<void> {
    await this.logPartyCreated(auditContext, input.partyId || "unknown", {
      envelopeId: input.envelopeId,
      partyName: input.name,
      partyEmail: input.email,
      partyRole: input.role,
      sequence: input.sequence});
  }

  async logUpdate(auditContext: AuditContext, input: any): Promise<void> {
    await this.logPartyUpdated(auditContext, input.partyId, {
      envelopeId: input.envelopeId,
      updates: {
        name: input.name,
        email: input.email,
        role: input.role,
        sequence: input.sequence
      }});
  }

  async logDelete(auditContext: AuditContext, input: any): Promise<void> {
    await this.logPartyDeleted(auditContext, input.partyId, {
      envelopeId: input.envelopeId});
  }
};
