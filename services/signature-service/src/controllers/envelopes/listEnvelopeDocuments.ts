/**
 * @file ListEnvelopeDocumentsController.controller.ts
 * @summary Controller for GET /envelopes/:envelopeId/documents
 * @description Validates input, derives tenant from auth context, wires ports,
 * and delegates to the ListDocuments app service. Errors are mapped by apiHandler.
 */

import type { HandlerFn } from "@lawprotect/shared-ts";
import { ok, validateRequest } from "@lawprotect/shared-ts";
import { wrapController, corsFromEnv } from "@/middleware/http";
import { tenantFromCtx } from "@/middleware/auth";
import { getContainer } from "@/infra/Container";
import { EnvelopeIdPath } from "@/schemas/common/path";
import { PaginationQuery } from "@/schemas/common/query";
import { toTenantId, toEnvelopeId } from "@/app/ports/shared";
import { listDocumentsApp } from "@/app/services/Envelope/ListDocumentsApp.service";
import { makeDocumentsQueriesPort } from "@/app/ports/documents/MakeDocumentsQueriesPort";

/**
 * Base handler function for listing documents of an envelope
 * @param evt - The Lambda event containing HTTP request data
 * @returns Promise resolving to HTTP response with documents list
 * @throws {AppError} When validation fails or query fails
 */
const base: HandlerFn = async (evt) => {
  const { path, query } = validateRequest(evt, {
    path: EnvelopeIdPath,
    query: PaginationQuery,
  });

  const tenantId = toTenantId(tenantFromCtx(evt));
  const envelopeId = toEnvelopeId(path.id);

  const c = getContainer();
  const documentsQueries = makeDocumentsQueriesPort(c.repos.documents);

  const result = await listDocumentsApp(
    {
      tenantId,
      envelopeId,
      limit: query.limit,
      cursor: query.cursor,
    },
    {
      documentsQueries,
    }
  );

  return ok({ data: { items: result.items } });
};

/**
 * Lambda handler for GET /envelopes/:envelopeId/documents endpoint
 * @param evt - The Lambda event containing HTTP request data
 * @returns Promise resolving to HTTP response with documents list
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
