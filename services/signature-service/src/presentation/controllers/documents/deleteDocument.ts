/**
 * @file DeleteDocumentController.controller.ts
 * @summary Controller for DELETE /documents/:documentId
 * @description Validates input, derives tenant from auth context, wires ports,
 * and delegates to the DeleteDocument app service. Errors are mapped by apiHandler.
 */

import type { HandlerFn } from "@lawprotect/shared-ts";
import { noContent, validateRequest } from "@lawprotect/shared-ts";
import { wrapController, corsFromEnv } from "@/presentation/middleware/http";
import { getContainer } from "@/core/Container";
import { DocumentIdPath } from "@/schemas/common/path";
import { toDocumentId } from "@/app/ports/shared";
import { deleteDocumentApp } from "@/app/services/Documents/DeleteDocumentApp.service";
import { makeDocumentsCommandsPort } from "@/app/adapters/documents/makeDocumentsCommandsPort";

/**
 * Base handler function for deleting a document
 * @param evt - The Lambda event containing HTTP request data
 * @returns Promise resolving to HTTP response
 * @throws {AppError} When document is not found or validation fails
 */
const base: HandlerFn = async (evt) => {
  const { path } = validateRequest(evt, { path: DocumentIdPath });

  const documentId = toDocumentId(path.id);

  const c = getContainer();
  const documentsCommands = makeDocumentsCommandsPort(c.repos.documents, c.repos.envelopes, { ids: c.ids });

  await deleteDocumentApp(
    { documentId },
    { documentsCommands }
  );

  return noContent();
};

/**
 * Lambda handler for DELETE /documents/:documentId endpoint
 * @param evt - The Lambda event containing HTTP request data
 * @returns Promise resolving to HTTP response
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
