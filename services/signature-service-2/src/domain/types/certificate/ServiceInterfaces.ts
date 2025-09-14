/**
 * @file ServiceInterfaces.ts
 * @summary Service interfaces for certificate operations
 * @description Defines interfaces for certificate services (validation, audit, etc.)
 */

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

