/**
 * @file GetDocumentController.controller.ts
 * @summary Controller for GET /documents/:documentId
 * @description Validates input, derives tenant from auth context, wires ports,
 * and delegates to the GetDocumentById app service. Errors are mapped by apiHandler.
 */

import type { HandlerFn } from "@lawprotect/shared-ts";
import { ok, validateRequest } from "@lawprotect/shared-ts";
import { wrapController, corsFromEnv } from "@/middleware/http";
import { getContainer } from "@/infra/Container";
import { DocumentIdPath } from "@/schemas/common/path";
import { toDocumentId } from "@/app/ports/shared";
import { getDocumentByIdApp } from "@/app/services/Documents/GetDocumentByIdApp.service";
import { makeDocumentsQueriesPort } from "@/app/adapters/documents/MakeDocumentsQueriesPort";

/**
 * Base handler function for getting a document by ID
 * @param evt - The Lambda event containing HTTP request data
 * @returns Promise resolving to HTTP response with document data
 * @throws {AppError} When document is not found or validation fails
 */
const base: HandlerFn = async (evt) => {
  const { path } = validateRequest(evt, { path: DocumentIdPath });

  const documentId = toDocumentId(path.id);

  const c = getContainer();
  const documentsQueries = makeDocumentsQueriesPort(c.repos.documents);

  const result = await getDocumentByIdApp(
    { documentId },
    { documentsQueries }
  );

  return ok({ data: result.document });
};

/**
 * Lambda handler for GET /documents/:documentId endpoint
 * @param evt - The Lambda event containing HTTP request data
 * @returns Promise resolving to HTTP response with document data
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
