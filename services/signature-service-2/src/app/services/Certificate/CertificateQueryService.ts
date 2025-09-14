/**
 * @file CertificateQueryService.ts
 * @summary Query service for certificate operations
 * @description Wrapper service for certificate queries
 */

import type { CertificateQueriesPort, GetCertificateQuery, GetCertificateResult } from "../../ports/certificate/CertificateQueriesPort";

/**
 * @summary Query service for certificate operations
 * @description Wrapper service that delegates to the certificate queries port
 */
export class DefaultCertificateQueryService {
  constructor(private readonly queriesPort: CertificateQueriesPort) {}

  /**
   * @summary Gets certificate and audit trail for an envelope
   * @description Delegates to the certificate queries port
   * @param query - The get certificate query parameters
   * @returns Promise resolving to certificate data or null if not found
   */
  async getCertificate(query: GetCertificateQuery): Promise<GetCertificateResult | null> {
    return this.queriesPort.getCertificate(query);
  }
};
