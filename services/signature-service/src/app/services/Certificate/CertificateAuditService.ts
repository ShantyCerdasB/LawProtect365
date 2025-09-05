/**
 * @file CertificateAuditService.ts
 * @summary Audit service for certificate operations
 * @description Provides audit logging for certificate access
 */

import { BaseAuditService } from "../../../shared/services/BaseAuditService";
import type { AuditContext } from "../../../domain/entities/AuditContext";
import type { CertificateAuditService } from "../../../shared/types/certificate/ServiceInterfaces";
import type { EnvelopeId, TenantId } from "../../../domain/value-objects/Ids";
import type { ActorContext } from "../../../domain/entities/ActorContext";
import { nowIso } from "@lawprotect/shared-ts";

/**
 * @summary Audit service for certificate operations
 * @description Extends BaseAuditService to provide certificate-specific audit logging
 */
export class DefaultCertificateAuditService extends BaseAuditService implements CertificateAuditService {
  
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
      // For Certificate, we always need an envelope context
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
   * @summary Logs certificate access for audit purposes
   * @description Records when a certificate is accessed for compliance tracking and security auditing
   * @param envelopeId - The envelope ID being accessed
   * @param tenantId - The tenant ID
   * @param actor - The actor accessing the certificate
   */
  async logGetCertificate(envelopeId: EnvelopeId, tenantId: TenantId, actor: ActorContext): Promise<void> {
    await this.logBusinessEvent({
      tenantId,
      envelopeId,
      actor,
    }, {
      eventType: "certificate.accessed",
      envelopeId,
      action: "get_certificate",
      timestamp: new Date().toISOString(),
    });
  }
}
