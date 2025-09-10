/**
 * @file GlobalPartiesAuditService.ts
 * @summary Audit service for Global Parties business logic
 * @description Handles audit logging for Global Party operations.
 * Extends BaseAuditService to provide Global Party-specific audit functionality.
 */

import { BaseAuditService } from "../../../domain/services/BaseAuditService";
import type { AuditContext, ActorContext } from "@lawprotect/shared-ts";
import { nowIso } from "@lawprotect/shared-ts";
import type {  PartyId, EnvelopeId } from "@/domain/value-objects/ids";

/**
 * @summary Audit service for Global Parties business logic
 * @description Extends BaseAuditService to provide Global Party-specific audit logging functionality.
 * This service is different from Audit Application Services - it's for business logic audit logging.
 */
export class GlobalPartiesAuditService extends BaseAuditService {
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
      // For Global Parties, we might not always have an envelope context
      // We'll use a placeholder or skip envelope-specific audit
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
   * @summary Logs a Global Party creation event for audit purposes
   * @description Records Global Party creation in the audit trail for compliance and traceability
   * @param context - Audit context containing tenant, envelope, and actor information
   * @param partyId - Global Party identifier
   * @param details - Additional creation details
   */
  async logGlobalPartyCreated(
    context: AuditContext,
    partyId: PartyId,
    details: Record<string, unknown> = {}
  ): Promise<void> {
    await this.logBusinessEvent(context, {
      eventType: "global_party.created",
      partyId,
      ...details});
  }

  /**
   * @summary Logs a Global Party update event for audit purposes
   * @description Records Global Party updates in the audit trail
   * @param context - Audit context containing tenant, envelope, and actor information
   * @param partyId - Global Party identifier
   * @param details - Update details including previous and new values
   */
  async logGlobalPartyUpdated(
    context: AuditContext,
    partyId: PartyId,
    details: Record<string, unknown> = {}
  ): Promise<void> {
    await this.logBusinessEvent(context, {
      eventType: "global_party.updated",
      partyId,
      ...details});
  }

  /**
   * @summary Logs a Global Party deletion event for audit purposes
   * @description Records Global Party deletion in the audit trail
   * @param context - Audit context containing tenant, envelope, and actor information
   * @param partyId - Global Party identifier
   * @param details - Deletion details
   */
  async logGlobalPartyDeleted(
    context: AuditContext,
    partyId: PartyId,
    details: Record<string, unknown> = {}
  ): Promise<void> {
    await this.logBusinessEvent(context, {
      eventType: "global_party.deleted",
      partyId,
      ...details});
  }

  /**
   * @summary Logs a Global Party access event for audit purposes
   * @description Records Global Party access in the audit trail
   * @param context - Audit context containing tenant, envelope, and actor information
   * @param partyId - Global Party identifier
   * @param details - Access details
   */
  async logGlobalPartyAccessed(
    context: AuditContext,
    partyId: PartyId,
    details: Record<string, unknown> = {}
  ): Promise<void> {
    await this.logBusinessEvent(context, {
      eventType: "global_party.accessed",
      partyId,
      ...details});
  }

  // Implementation of GlobalPartiesAuditService interface methods
  async logCreate(partyId: PartyId, actor: ActorContext): Promise<void> {
    await this.logBusinessEvent({
      actor,
      envelopeId: undefined}, {
      eventType: "global_party.created",
      partyId});
  }

  async logUpdate(partyId: PartyId, actor: ActorContext): Promise<void> {
    await this.logBusinessEvent({
      actor,
      envelopeId: undefined}, {
      eventType: "global_party.updated",
      partyId});
  }

  async logDelete(partyId: PartyId, actor: ActorContext): Promise<void> {
    await this.logBusinessEvent({
      actor,
      envelopeId: undefined}, {
      eventType: "global_party.deleted",
      partyId});
  }

  async logAccess(partyId: PartyId, actor: ActorContext): Promise<void> {
    await this.logBusinessEvent({
      actor,
      envelopeId: undefined}, {
      eventType: "global_party.accessed",
      partyId});
  }
}

