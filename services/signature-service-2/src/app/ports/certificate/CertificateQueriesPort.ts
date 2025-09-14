/**
 * @file CertificateQueriesPort.ts
 * @summary Port interface for certificate queries
 * @description Defines the interface for certificate query operations
 */

import type { EnvelopeId } from "../../../domain/value-objects/ids";
import type { AuditEvent } from "../../../domain/value-objects/audit";

// ============================================================================
// QUERY TYPES
// ============================================================================

/**
 * @summary Input for getting certificate query
 * @description Parameters for retrieving certificate and audit trail
 */
export interface GetCertificateQuery {
  /** Tenant identifier */
  
  /** Envelope identifier */
  readonly envelopeId: EnvelopeId;
  /** Maximum number of events to return */
  readonly limit: number;
  /** Optional cursor for pagination */
  readonly cursor?: string;
}

/**
 * @summary Result for getting certificate query
 * @description Contains certificate data and audit trail
 */
export interface GetCertificateResult {
  /** Envelope identifier */
  readonly envelopeId: EnvelopeId;
  /** Current envelope status */
  readonly status: string;
  /** Array of audit events */
  readonly events: AuditEvent[];
  /** Whether the hash chain is valid */
  readonly chainValid: boolean;
  /** Optional cursor for next page */
  readonly nextCursor?: string;
}

// ============================================================================
// PORT INTERFACE
// ============================================================================

/**
 * @summary Port interface for certificate queries
 * @description Defines the contract for certificate query operations
 */
export interface CertificateQueriesPort {
  /**
   * @summary Gets certificate and audit trail for an envelope
   * @description Retrieves the certificate data and complete audit trail for an envelope
   * @param query - The get certificate query parameters
   * @returns Promise resolving to certificate data or null if not found
   */
  getCertificate(query: GetCertificateQuery): Promise<GetCertificateResult | null>;
};
