/**
 * @file CertificateValidationService.ts
 * @summary Validation service for certificate operations
 * @description Provides validation logic for certificate queries
 */

import { BadRequestError, ErrorCodes } from "@lawprotect/shared-ts";
import type { CertificateValidationService } from "../../../domain/types/certificate/ServiceInterfaces";
import type { GetCertificateQuery } from "../../ports/certificate/CertificateQueriesPort";

/**
 * @summary Validation service for certificate operations
 * @description Provides validation logic for certificate queries
 */
export class DefaultCertificateValidationService implements CertificateValidationService {
  
  /**
   * @summary Validates get certificate query parameters
   * @description Validates envelope ID, tenant ID, limit, and cursor parameters
   * @param query - The get certificate query to validate
   * @throws BadRequestError if validation fails
   */
  validateGetCertificate(query: GetCertificateQuery): void {
    if (!query.envelopeId || query.envelopeId.trim().length === 0) {
      throw new BadRequestError("Envelope ID is required", ErrorCodes.COMMON_BAD_REQUEST, { query });
    }

    if (!query) {
      throw new BadRequestError("Query is required", ErrorCodes.COMMON_BAD_REQUEST, { query });
    }

    if (!query.limit || query.limit < 1 || query.limit > 100) {
      throw new BadRequestError("Limit must be between 1 and 100", ErrorCodes.COMMON_BAD_REQUEST, { query });
    }

    if (query.cursor && query.cursor.trim().length === 0) {
      throw new BadRequestError("Cursor cannot be empty", ErrorCodes.COMMON_BAD_REQUEST, { query });
    }
  }
};
