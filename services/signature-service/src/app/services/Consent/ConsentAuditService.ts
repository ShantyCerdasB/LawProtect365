/**
 * @file ConsentAuditService.ts
 * @summary Audit service for consent business logic
 * @description Handles audit logging for consent-related business events.
 * Extends BaseAuditService to provide consent-specific audit functionality.
 */

import { BaseAuditService } from "../../../domain/services/BaseAuditService";
import type { AuditContext } from "@lawprotect/shared-ts";
import type { 
  ConsentDelegationAuditDetails,
  ConsentUpdateAuditDetails 
} from "../../../domain/types/consent/AuditDetails";
import type { EnvelopeId } from "../../../domain/value-objects/ids";
import { BadRequestError } from "../../../shared/errors";
import { nowIso } from "@lawprotect/shared-ts";

/**
 * @summary Audit service for consent business logic
 * @description Extends BaseAuditService to provide consent-specific audit logging functionality.
 * This service is different from Audit Application Services - it's for business logic audit logging.
 */
export class ConsentAuditService extends BaseAuditService {
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
      throw new BadRequestError("EnvelopeId is required for consent audit events");
    }

    await this.auditRepo.record({
      envelopeId: context.envelopeId as EnvelopeId,
      type: details.eventType as string,
      occurredAt: nowIso(),
      actor: context.actor,
      metadata: details});
  }

  /**
   * @summary Logs a consent delegation event for audit purposes
   * @description Records consent delegation in the audit trail for compliance and traceability
   * @param context - Audit context containing tenant, envelope, and actor information
   * @param details - Consent delegation details
   */
  async logConsentDelegation(
    context: AuditContext,
    details: ConsentDelegationAuditDetails
  ): Promise<void> {
    await this.logBusinessEvent(context, {
      eventType: "consent.delegated",
      consentId: details.consentId,
      originalPartyId: details.originalPartyId,
      delegatePartyId: details.delegatePartyId,
      delegationId: details.delegationId,
      reason: details.reason,
      expiresAt: details.expiresAt,
      metadata: details.metadata});
  }

  /**
   * @summary Logs a consent update event for audit purposes
   * @description Records consent status updates in the audit trail
   * @param context - Audit context containing tenant, envelope, and actor information
   * @param details - Consent update details
   */
  async logConsentUpdate(
    context: AuditContext,
    details: ConsentUpdateAuditDetails
  ): Promise<void> {
    await this.logBusinessEvent(context, {
      eventType: "consent.updated",
      consentId: details.consentId,
      previousStatus: details.previousStatus,
      newStatus: details.newStatus,
      reason: details.reason,
      metadata: details.metadata});
  }
};
