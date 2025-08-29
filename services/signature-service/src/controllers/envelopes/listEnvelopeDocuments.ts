/**
 * Controller for GET /envelopes/:envelopeId/documents
 * - Validates input (path + query)
 * - Derives tenant from auth context
 * - Wires documents queries port (adapter over repo)
 * - Delegates to port and returns items (schema does not include nextCursor)
 */
import type { HandlerFn } from "@lawprotect/shared-ts";
import { ok, validateRequest } from "@lawprotect/shared-ts";

import { wrapController, corsFromEnv } from "@/middleware/http";
import { tenantFromCtx } from "@/middleware/auth";
import { getContainer } from "@/infra/Container";

import { EnvelopeIdPath } from "@/schemas/common/path";
import { PaginationQuery } from "@/schemas/common/query";

import { toTenantId, toEnvelopeId } from "@/app/ports/shared/cast";
import { makeDocumentsQueriesPort } from "@/app/ports/documents/MakeDocumentsQueriesPort";

const base: HandlerFn = async (evt) => {
  const { path, query } = validateRequest(evt, {
    path: EnvelopeIdPath,   // { id: string }
    query: PaginationQuery, // { limit?: number; cursor?: string }
  });

  const tenantId   = toTenantId(tenantFromCtx(evt));
  const envelopeId = toEnvelopeId(path.id); // <- usa "id" del schema

  const c = getContainer();
  const documents = makeDocumentsQueriesPort(c.repos.documents);

  const page = await documents.listByEnvelope({
    tenantId,
    envelopeId,
    limit: query.limit,
    cursor: query.cursor,
  });

  // El schema público no incluye nextCursor
  return ok({ data: { items: page.items } });
};

export const handler = wrapController(base, {
  auth: true,
  observability: { logger: () => console, metrics: () => ({} as any), tracer: () => ({} as any) },
  cors: corsFromEnv(),
});
