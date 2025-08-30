/**
 * @file listParties.ts
 * @description Controller for listing Parties via GET /envelopes/{envelopeId}/parties endpoint.
 * Validates input, derives tenant from auth context, and delegates to the ListParties app service.
 */

import type { HandlerFn } from "@lawprotect/shared-ts";
import { ok, validateRequest } from "@lawprotect/shared-ts";
import { wrapController, corsFromEnv } from "@/middleware/http";
import { tenantFromCtx } from "@/middleware/auth";
import { getContainer } from "@/infra/Container";
import { ListPartiesParams, ListPartiesQuery } from "@/schemas/parties";
import { listPartiesApp } from "@/app/services/Parties/ListPartiesApp.service";
import { makePartiesQueriesPort } from "@/app/adapters/parties/MakePartiesQueriesPort";

/**
 * @description Base handler function for listing Parties.
 * Validates path and query parameters, extracts tenant information, and delegates to the app service.
 *
 * @param {any} evt - The Lambda event containing HTTP request data
 * @returns {Promise<any>} Promise resolving to HTTP response with Parties list
 * @throws {AppError} When validation fails or listing fails
 */
const base: HandlerFn = async (evt) => {
  const { params, query } = validateRequest(evt, { 
    params: ListPartiesParams,
    query: ListPartiesQuery,
  });

  const tenantId = tenantFromCtx(evt);

  const c = getContainer();
  const partiesQueries = makePartiesQueriesPort({ parties: c.repos.parties });

  const result = await listPartiesApp(
    {
      tenantId,
      envelopeId: params.envelopeId,
      role: query.role,
      status: query.status,
      limit: query.limit,
      cursor: query.cursor,
    },
    {
      partiesQueries,
    }
  );

  return ok({
    data: result.parties,
    pagination: {
      nextCursor: result.nextCursor,
      total: result.total,
    },
  });
};

/**
 * @description Lambda handler for GET /envelopes/{envelopeId}/parties endpoint.
 * Wraps the base handler with authentication, observability, and CORS middleware.
 *
 * @param {any} evt - The Lambda event containing HTTP request data
 * @returns {Promise<any>} Promise resolving to HTTP response with Parties list
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



