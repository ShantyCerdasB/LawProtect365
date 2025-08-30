/**
 * @file listGlobalParties.ts
 * @description Controller for listing Global Parties via GET /global-parties endpoint.
 * Validates input, derives tenant from auth context, and delegates to the ListGlobalParties app service.
 */

import type { HandlerFn } from "@lawprotect/shared-ts";
import { ok, validateRequest } from "@lawprotect/shared-ts";
import { wrapController, corsFromEnv } from "@/middleware/http";
import { tenantFromCtx } from "@/middleware/auth";
import { getContainer } from "@/infra/Container";
import { ListGlobalPartiesQuery } from "@/schemas/global-parties";
import { listGlobalPartiesApp } from "@/app/services/GlobalParties/ListGlobalPartiesApp.service";
import { makeGlobalPartiesQueriesPort } from "@/app/adapters/global-parties/MakeGlobalPartiesQueriesPort";

/**
 * @description Base handler function for listing Global Parties.
 * Validates query parameters, extracts tenant information, and delegates to the app service.
 *
 * @param {any} evt - The Lambda event containing HTTP request data
 * @returns {Promise<any>} Promise resolving to HTTP response with Global Parties list
 * @throws {AppError} When validation fails or listing fails
 */
const base: HandlerFn = async (evt) => {
  const { query } = validateRequest(evt, { query: ListGlobalPartiesQuery });

  const tenantId = tenantFromCtx(evt);

  const c = getContainer();
  const globalPartiesQueries = makeGlobalPartiesQueriesPort({ globalParties: c.repos.globalParties });

  const result = await listGlobalPartiesApp(
    {
      tenantId,
      search: query.search,
      tags: query.tags,
      role: query.role,
      source: query.source,
      status: query.status,
      limit: query.limit,
      cursor: query.cursor,
    },
    {
      globalPartiesQueries,
    }
  );

  return ok({
    data: result.globalParties,
    pagination: {
      nextCursor: result.nextCursor,
      total: result.total,
    },
  });
};

/**
 * @description Lambda handler for GET /global-parties endpoint.
 * Wraps the base handler with authentication, observability, and CORS middleware.
 *
 * @param {any} evt - The Lambda event containing HTTP request data
 * @returns {Promise<any>} Promise resolving to HTTP response with Global Parties list
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
