/**
 * @file PatchDocumentController.controller.ts
 * @summary Controller for PATCH /documents/:documentId
 * @description Validates input, derives tenant from auth context, wires ports,
 * and delegates to the PatchDocument app service. Errors are mapped by apiHandler.
 */

import type { HandlerFn } from "@lawprotect/shared-ts";
import { ok, validateRequest } from "@lawprotect/shared-ts";
import { wrapController, corsFromEnv } from "@/presentation/middleware/http";
import { getContainer } from "@/core/Container";
import { DocumentIdPath } from "@/schemas/common/path";
import { PatchDocumentBody } from "@/schemas/documents/PatchDocument.schema";
import { toDocumentId } from "@/app/ports/shared";
import { patchDocumentApp } from "@/app/services/Documents/PatchDocumentApp.service";
import { makeDocumentsCommandsPort } from "@/app/adapters/documents/makeDocumentsCommandsPort";

/**
 * Base handler function for patching a document
 * @param evt - The Lambda event containing HTTP request data
 * @returns Promise resolving to HTTP response with updated document data
 * @throws {AppError} When document is not found or validation fails
 */
const base: HandlerFn = async (evt) => {
  const { path, body } = validateRequest(evt, { 
    path: DocumentIdPath,
    body: PatchDocumentBody 
  });

  const documentId = toDocumentId(path.id);

  const c = getContainer();
  const documentsCommands = makeDocumentsCommandsPort(c.repos.documents, c.repos.envelopes, { ids: c.ids });

  const result = await patchDocumentApp(
    { 
      documentId,
      name: body.name,
      metadata: body.metadata
    },
    { documentsCommands }
  );

  return ok({ data: { id: result.documentId, updatedAt: result.updatedAt } });
};

/**
 * Lambda handler for PATCH /documents/:documentId endpoint
 * @param evt - The Lambda event containing HTTP request data
 * @returns Promise resolving to HTTP response with updated document data
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
