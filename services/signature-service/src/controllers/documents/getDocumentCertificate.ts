/**
 * @file getDocumentCertificate.ts
 * @description Controller for getting document certificate via GET /documents/:documentId/certificate endpoint.
 * Validates input, derives tenant from auth context, and delegates to the GetDocumentCertificate app service.
 */

import type { HandlerFn } from "@lawprotect/shared-ts";
import { ok, validateRequest } from "@lawprotect/shared-ts";
import { wrapController, corsFromEnv } from "@/middleware/http";
import { getContainer } from "@/infra/Container";
import { DocumentIdPath } from "@/schemas/common/path";
import { toDocumentId } from "@/app/ports/shared";
import { getDocumentCertificateApp } from "@/app/services/Documents/GetDocumentCertificateApp.service";
import { makeDocumentsQueriesPort } from "@/app/adapters/documents/MakeDocumentsQueriesPort";

/**
 * @description Base handler function for getting document certificate.
 * Validates path parameters, extracts tenant information, and delegates to the app service.
 *
 * @param {any} evt - The Lambda event containing HTTP request data
 * @returns {Promise<any>} Promise resolving to HTTP response with document certificate data or error
 * @throws {AppError} When validation fails or certificate retrieval fails
 */
const base: HandlerFn = async (evt) => {
  const { path } = validateRequest(evt, { path: DocumentIdPath });

  const documentId = toDocumentId(path.id);

  const c = getContainer();
  const documentsQueries = makeDocumentsQueriesPort(c.repos.documents);

  const result = await getDocumentCertificateApp(
    { documentId },
    { documentsQueries }
  );

  return ok({ data: { certificate: result.certificate, downloadUrl: result.downloadUrl } });
};

/**
 * @description Lambda handler for GET /documents/:documentId/certificate endpoint.
 * Wraps the base handler with authentication, observability, and CORS middleware.
 *
 * @param {any} evt - The Lambda event containing HTTP request data
 * @returns {Promise<any>} Promise resolving to HTTP response with document certificate data
 */
export const handler = wrapController(base, {
  auth: true,
  observability: {
    logger: () => console,
    metrics: () => ({} as any),
    tracer: () => ({} as any),
  },
  cors: corsFromEnv(),
});
