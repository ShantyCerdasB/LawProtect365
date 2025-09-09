/**
 * @file BaseAuditService.ts
 * @summary Base abstract class for audit business logic services
 * @description Provides a common interface for audit logging across different modules.
 * This service is different from Audit Application Services - it's for business logic audit logging.
 */

import type { AuditRepository } from "../../domain/contracts/repositories/audit/AuditRepository";
import type { AuditContext } from "@lawprotect/shared-ts";
import { EnvelopeId, TenantId } from "@/domain/value-objects/ids";
import { ActorContext } from "@lawprotect/shared-ts";

/**
 * @summary Base abstract class for audit business logic services
 * @description Provides common audit logging functionality that can be extended
 * by module-specific audit services (ConsentAuditService, EnvelopeAuditService, etc.)
 */
export abstract class BaseAuditService {
  constructor(protected readonly auditRepo: AuditRepository) {}

  /**
   * @summary Logs a business event for audit purposes
   * @description Records a business event in the audit trail for compliance and traceability
   * @param context - Audit context containing tenant, envelope, and actor information
   * @param details - Module-specific audit details
   */
  abstract logBusinessEvent(
    context: AuditContext, 
    details: Record<string, unknown>
  ): Promise<void>;

  /**
   * @summary Creates a standardized audit context
   * @description Helper method to create audit context with common fields
   * @param tenantId - Tenant identifier
   * @param envelopeId - Envelope identifier
   * @param actor - Actor information
   * @returns AuditContext object
   */
  protected createAuditContext(
    tenantId: TenantId,
    envelopeId: EnvelopeId,
    actor: ActorContext
  ): AuditContext {
    return {
      tenantId,
      envelopeId,
      actor
    };
  }
}






