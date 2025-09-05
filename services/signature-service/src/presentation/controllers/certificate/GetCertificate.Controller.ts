/**
 * @file GetCertificate.Controller.ts
 * @summary Get Certificate controller
 * @description Handles retrieval of certificate and audit trail for an envelope
 */

import { createQueryController } from "../../../shared/controllers/queryFactory";
import { makeCertificateQueriesPort } from "../../../app/adapters/certificate/makeCertificateQueriesPort";
import { DefaultCertificateQueryService } from "../../../app/services/Certificate";
import { GetCertificateQuery } from "../../../presentation/schemas/certificate/GetCertificate.schema";
import { EnvelopeIdPath } from "../../../presentation/schemas/common/path";
import type { GetCertificateControllerInput } from "../../../shared/types/certificate/ControllerInputs";
import type { GetCertificateResult } from "../../../app/ports/certificate/CertificateQueriesPort";

/**
 * @description Get Certificate controller
 */
export const GetCertificateController = createQueryController<GetCertificateControllerInput, GetCertificateResult | null>({
  querySchema: GetCertificateQuery,
  pathSchema: EnvelopeIdPath,
  appServiceClass: DefaultCertificateQueryService,
  createDependencies: (c) => makeCertificateQueriesPort(
    c.repos.audit,
    c.repos.envelopes,
    c.certificate.validationService
  ),
  extractParams: (path, query) => ({
    tenantId: path.tenantId,
    envelopeId: path.id,
    limit: query.limit,
    cursor: query.cursor,
  }),
  responseType: "ok"
});

// Export handler for backward compatibility
export const handler = GetCertificateController;
