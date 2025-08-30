/**
 * @file ListEnvelopePartiesController.controller.ts
 * @summary Controller for GET /envelopes/:envelopeId/parties
 * @description Validates input, derives tenant from auth context, wires ports,
 * and delegates to the ListParties app service. Errors are mapped by apiHandler.
 */

import type { HandlerFn } from "@lawprotect/shared-ts";
import { ok, validateRequest } from "@lawprotect/shared-ts";
import { wrapController, corsFromEnv } from "@/presentation/middleware/http";
import { tenantFromCtx } from "@/presentation/middleware/auth";
import { getContainer } from "@/core/Container";
import { EnvelopeIdPath } from "@/schemas/common/path";
import { PaginationQuery } from "@/schemas/common/query";
import { toTenantId, toEnvelopeId } from "@/app/ports/shared";
import { listPartiesApp } from "@/app/services/Envelope/ListPartiesApp.service";
import { makePartiesQueriesPort } from "@/app/ports/parties/MakePartiesQueryPort";

/**
 * Base handler function for listing parties of an envelope
 * @param evt - The Lambda event containing HTTP request data
 * @returns Promise resolving to HTTP response with paginated parties list
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
  const partiesQueries = makePartiesQueriesPort(c.repos.parties);

  const result = await listPartiesApp(
    {
      tenantId,
      envelopeId,
      limit: query.limit,
      cursor: query.cursor,
    },
    {
      partiesQueries,
    }
  );

  return ok({
    data: {
      items: result.items,
      nextCursor: result.nextCursor ?? null,
    },
  });
};

/**
 * Lambda handler for GET /envelopes/:envelopeId/parties endpoint
 * @param evt - The Lambda event containing HTTP request data
 * @returns Promise resolving to HTTP response with paginated parties list
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
