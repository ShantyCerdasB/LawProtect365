/**
 * @file getDocumentPage.ts
 * @description Controller for getting document page preview via GET /envelopes/:envelopeId/documents/:docId/pages/:pageNo endpoint.
 * Validates input, derives tenant from auth context, and delegates to the GetDocumentPage app service.
 */

import type { HandlerFn } from "@lawprotect/shared-ts";
import { ok, validateRequest } from "@lawprotect/shared-ts";
import { wrapController, corsFromEnv } from "@/presentation/middleware/http";
import { getContainer } from "@/core/Container";
import { EnvelopeDocPagePath } from "@/schemas/common/path";
import { toEnvelopeId, toDocumentId } from "@/app/ports/shared";
import { getDocumentPageApp } from "@/app/services/Documents/GetDocumentPageApp.service";
import { makeDocumentsQueriesPort } from "@/app/adapters/documents/MakeDocumentsQueriesPort";
import { z } from "@lawprotect/shared-ts";

/**
 * @description Base handler function for getting document page preview.
 * Validates path parameters, extracts tenant information, and delegates to the app service.
 *
 * @param {any} evt - The Lambda event containing HTTP request data
 * @returns {Promise<any>} Promise resolving to HTTP response with document page data or error
 * @throws {AppError} When validation fails or page retrieval fails
 */
const base: HandlerFn = async (evt) => {
  const { path, query } = validateRequest(evt, { 
    path: EnvelopeDocPagePath,
    query: z.object({
      w: z.coerce.number().int().positive().optional(),
      h: z.coerce.number().int().positive().optional(),
      quality: z.coerce.number().int().min(1).max(100).optional(),
    }).optional()
  });

  const envelopeId = toEnvelopeId(path.envelopeId);
  const documentId = toDocumentId(path.docId);
  const pageNo = path.pageNo;

  const c = getContainer();
  const documentsQueries = makeDocumentsQueriesPort(c.repos.documents);

  const result = await getDocumentPageApp(
    { 
      envelopeId,
      documentId,
      pageNo,
      width: query?.w,
      height: query?.h,
      quality: query?.quality
    },
    { documentsQueries }
  );

  return ok({ data: { page: result.page, imageUrl: result.imageUrl } });
};

/**
 * @description Lambda handler for GET /envelopes/:envelopeId/documents/:docId/pages/:pageNo endpoint.
 * Wraps the base handler with authentication, observability, and CORS middleware.
 *
 * @param {any} evt - The Lambda event containing HTTP request data
 * @returns {Promise<any>} Promise resolving to HTTP response with document page data
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
