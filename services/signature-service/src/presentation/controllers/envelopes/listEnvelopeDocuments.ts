/**
 * @file ListEnvelopeDocumentsController.controller.ts
 * @summary Controller for GET /envelopes/:envelopeId/documents
 * @description Validates input, derives tenant from auth context, wires ports,
 * and delegates to the ListDocuments app service. Errors are mapped by apiHandler.
 */

import type { HandlerFn } from "@lawprotect/shared-ts";
import { ok, validateRequest, z } from "@lawprotect/shared-ts";
import { wrapController, corsFromEnv } from "@/presentation/middleware/http";
import { getContainer } from "@/core/Container";
import { EnvelopeIdPath } from "@/schemas/common/path";
import { toEnvelopeId } from "@/app/ports/shared";
import { listDocumentsApp } from "@/app/services/Documents/ListDocumentsApp.service";
import { makeDocumentsQueriesPort } from "@/app/ports/documents/MakeDocumentsQueriesPort";

/**
 * Base handler function for listing documents by envelope
 * @param evt - The Lambda event containing HTTP request data
 * @returns Promise resolving to HTTP response with document list
 * @throws {AppError} When validation fails
 */
const base: HandlerFn = async (evt) => {
  const { path, query } = validateRequest(evt, { 
    path: EnvelopeIdPath,
    query: z.object({
      limit: z.coerce.number().int().positive().optional(),
      cursor: z.string().optional(),
    }).optional()
  });

  const envelopeId = toEnvelopeId(path.id);

  const c = getContainer();
  const documentsQueries = makeDocumentsQueriesPort(c.repos.documents);

  const result = await listDocumentsApp(
    { 
      envelopeId,
      limit: query?.limit,
      cursor: query?.cursor
    },
    { documentsQueries }
  );

  return ok({ 
    data: {
      items: result.items,
      nextCursor: result.nextCursor,
    }
  });
};

/**
 * Lambda handler for GET /envelopes/:envelopeId/documents endpoint
 * @param evt - The Lambda event containing HTTP request data
 * @returns Promise resolving to HTTP response with document list
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
