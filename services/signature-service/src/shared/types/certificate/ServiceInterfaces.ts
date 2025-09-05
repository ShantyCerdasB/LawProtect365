/**
 * @file ServiceInterfaces.ts
 * @summary Service interfaces for certificate operations
 * @description Defines interfaces for certificate services (validation, audit, etc.)
 */

import type { EnvelopeId, TenantId } from "../../../domain/value-objects/Ids";
import type { ActorContext } from "../../../domain/entities/ActorContext";
import type { GetCertificateQuery } from "../../../app/ports/certificate/CertificateQueriesPort";

// ============================================================================
// VALIDATION SERVICE
// ============================================================================

/**
 * @summary Validation service for certificate operations
 * @description Provides validation logic for certificate queries
 */
export interface CertificateValidationService {
  /**
   * @summary Validates get certificate query parameters
   * @description Validates envelope ID, tenant ID, limit, and cursor parameters
   * @param query - The get certificate query to validate
   * @throws BadRequestError if validation fails
   */
  validateGetCertificate(query: GetCertificateQuery): void;
}

// ============================================================================
// AUDIT SERVICE
// ============================================================================

/**
 * @summary Audit service for certificate operations
 * @description Provides audit logging for certificate access
 */
export interface CertificateAuditService {
  /**
   * @summary Logs certificate access for audit purposes
   * @description Records when a certificate is accessed for compliance tracking
   * @param envelopeId - The envelope ID being accessed
   * @param tenantId - The tenant ID
   * @param actor - The actor accessing the certificate
   */
  logGetCertificate(envelopeId: EnvelopeId, tenantId: TenantId, actor: ActorContext): Promise<void>;
}
