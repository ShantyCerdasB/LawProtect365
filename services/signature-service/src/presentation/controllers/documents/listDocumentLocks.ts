/**
 * @file listDocumentLocks.ts
 * @description Controller for listing document locks via GET /documents/:documentId/locks endpoint.
 * Validates input, derives tenant from auth context, and delegates to the ListDocumentLocks app service.
 */

import type { HandlerFn } from "@lawprotect/shared-ts";
import { ok, validateRequest } from "@lawprotect/shared-ts";
import { wrapController, corsFromEnv } from "@/presentation/middleware/http";
import { getContainer } from "@/core/Container";
import { DocumentIdPath } from "@/schemas/common/path";
import { toDocumentId } from "@/app/ports/shared";
import { listDocumentLocksApp } from "@/app/services/Documents/ListDocumentLocksApp.service";
import { makeDocumentsQueriesPort } from "@/app/ports/documents";


/**
 * @description Base handler function for listing document locks.
 * Validates path parameters, extracts tenant information, and delegates to the app service.
 *
 * @param {any} evt - The Lambda event containing HTTP request data
 * @returns {Promise<any>} Promise resolving to HTTP response with document locks list or error
 * @throws {AppError} When validation fails or locks listing fails
 */
const base: HandlerFn = async (evt) => {
  const { path } = validateRequest(evt, { path: DocumentIdPath });

  const documentId = toDocumentId(path.id);

  const c = getContainer();
  const documentsQueries = makeDocumentsQueriesPort(c.repos.documents);

  const result = await listDocumentLocksApp(
    { documentId },
    { documentsQueries }
  );

  return ok({ data: { locks: result.locks } });
};

/**
 * @description Lambda handler for GET /documents/:documentId/locks endpoint.
 * Wraps the base handler with authentication, observability, and CORS middleware.
 *
 * @param {any} evt - The Lambda event containing HTTP request data
 * @returns {Promise<any>} Promise resolving to HTTP response with document locks list
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
