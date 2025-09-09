/**
 * @file SigningAuditService.ts
 * @summary Audit service for Signing business logic
 * @description Handles audit logging for Signing operations.
 * Extends BaseAuditService to provide Signing-specific audit functionality.
 */

import { BaseAuditService } from "../../../domain/services/BaseAuditService";
import type { AuditContext, ActorContext } from "@lawprotect/shared-ts";
import type { EnvelopeId, PartyId, TenantId } from "@/domain/value-objects/ids";
import { nowIso } from "@lawprotect/shared-ts";
import type { SigningAuditService as ISigningAuditService } from "../../../domain/types/signing";

/**
 * @summary Audit service for Signing business logic
 * @description Extends BaseAuditService to provide Signing-specific audit logging functionality.
 * This service is different from Audit Application Services - it's for business logic audit logging.
 */
export class SigningAuditService extends BaseAuditService implements ISigningAuditService {
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
      // For Signing operations, we always need an envelope context
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
   * @summary Logs a signing completion event for audit purposes
   * @description Records signing completion in the audit trail for compliance and traceability
   * @param envelopeId - Envelope identifier
   * @param partyId - Party identifier
   * @param tenantId - Tenant identifier
   * @param actor - Actor context for audit purposes
   */
  async logSigningCompleted(
    envelopeId: EnvelopeId,
    partyId: PartyId,
    tenantId: TenantId,
    actor: ActorContext
  ): Promise<void> {
    await this.logBusinessEvent({
      tenantId,
      actor,
      envelopeId,
    }, {
      eventType: "signing.completed",
      envelopeId,
      partyId,
    });
  }

  /**
   * @summary Logs a signing decline event for audit purposes
   * @description Records signing decline in the audit trail
   * @param envelopeId - Envelope identifier
   * @param partyId - Party identifier
   * @param tenantId - Tenant identifier
   * @param actor - Actor context for audit purposes
   */
  async logSigningDeclined(
    envelopeId: EnvelopeId,
    partyId: PartyId,
    tenantId: TenantId,
    actor: ActorContext
  ): Promise<void> {
    await this.logBusinessEvent({
      tenantId,
      actor,
      envelopeId,
    }, {
      eventType: "signing.declined",
      envelopeId,
      partyId,
    });
  }

  /**
   * @summary Logs an OTP request event for audit purposes
   * @description Records OTP request in the audit trail
   * @param envelopeId - Envelope identifier
   * @param partyId - Party identifier
   * @param tenantId - Tenant identifier
   * @param actor - Actor context for audit purposes
   */
  async logOtpRequested(
    envelopeId: EnvelopeId,
    partyId: PartyId,
    tenantId: TenantId,
    actor: ActorContext
  ): Promise<void> {
    await this.logBusinessEvent({
      tenantId,
      actor,
      envelopeId,
    }, {
      eventType: "otp.requested",
      envelopeId,
      partyId,
    });
  }

  /**
   * @summary Logs an OTP verification event for audit purposes
   * @description Records OTP verification in the audit trail
   * @param envelopeId - Envelope identifier
   * @param partyId - Party identifier
   * @param tenantId - Tenant identifier
   * @param actor - Actor context for audit purposes
   */
  async logOtpVerified(
    envelopeId: EnvelopeId,
    partyId: PartyId,
    tenantId: TenantId,
    actor: ActorContext
  ): Promise<void> {
    await this.logBusinessEvent({
      tenantId,
      actor,
      envelopeId,
    }, {
      eventType: "otp.verified",
      envelopeId,
      partyId,
    });
  }

  /**
   * @summary Logs a presign upload event for audit purposes
   * @description Records presign upload in the audit trail
   * @param envelopeId - Envelope identifier
   * @param tenantId - Tenant identifier
   * @param actor - Actor context for audit purposes
   */
  async logPresignUpload(
    envelopeId: EnvelopeId,
    tenantId: TenantId,
    actor: ActorContext
  ): Promise<void> {
    await this.logBusinessEvent({
      tenantId,
      actor,
      envelopeId,
    }, {
      eventType: "signing.presign_upload",
      envelopeId,
    });
  }

  /**
   * @summary Logs a download signed document event for audit purposes
   * @description Records download signed document in the audit trail
   * @param envelopeId - Envelope identifier
   * @param tenantId - Tenant identifier
   * @param actor - Actor context for audit purposes
   */
  async logDownloadSignedDocument(
    envelopeId: EnvelopeId,
    tenantId: TenantId,
    actor: ActorContext
  ): Promise<void> {
    await this.logBusinessEvent({
      tenantId,
      actor,
      envelopeId,
    }, {
      eventType: "signing.download_signed_document",
      envelopeId,
    });
  }

  /**
   * @summary Logs a signing preparation event for audit purposes
   * @description Records signing preparation in the audit trail
   * @param envelopeId - Envelope identifier
   * @param partyId - Party identifier
   * @param tenantId - Tenant identifier
   * @param actor - Actor context for audit purposes
   */
  async logSigningPrepared(
    envelopeId: EnvelopeId,
    partyId: PartyId,
    tenantId: TenantId,
    actor: ActorContext
  ): Promise<void> {
    await this.logBusinessEvent({
      tenantId,
      actor,
      envelopeId,
    }, {
      eventType: "signing.prepared",
      envelopeId,
      partyId,
    });
  }

  /**
   * @summary Logs a signing consent recorded event for audit purposes
   * @description Records signing consent in the audit trail
   * @param envelopeId - Envelope identifier
   * @param partyId - Party identifier
   * @param tenantId - Tenant identifier
   * @param actor - Actor context for audit purposes
   */
  async logSigningConsentRecorded(
    envelopeId: EnvelopeId,
    partyId: PartyId,
    tenantId: TenantId,
    actor: ActorContext
  ): Promise<void> {
    await this.logBusinessEvent({
      tenantId,
      actor,
      envelopeId,
    }, {
      eventType: "signing.consent_recorded",
      envelopeId,
      partyId,
    });
  }
};
