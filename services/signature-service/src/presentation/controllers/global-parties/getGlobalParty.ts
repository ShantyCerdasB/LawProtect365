/**
 * @file getGlobalParty.ts
 * @description Controller for getting Global Party by ID via GET /global-parties/{globalPartyId} endpoint.
 * Validates input, derives tenant from auth context, and delegates to the GetGlobalParty app service.
 */

import type { HandlerFn } from "@lawprotect/shared-ts";
import { ok, validateRequest } from "@lawprotect/shared-ts";
import { wrapController, corsFromEnv } from "@/presentation/middleware/http";
import { tenantFromCtx } from "@/presentation/middleware/auth";
import { getContainer } from "@/core/Container";
import { GetGlobalPartyParams } from "@/schemas/global-parties";
import { getGlobalPartyApp } from "@/app/services/GlobalParties/GetGlobalPartyApp.service";
import { makeGlobalPartiesQueriesPort } from "@/app/adapters/global-parties/MakeGlobalPartiesQueriesPort";

/**
 * @description Base handler function for getting a Global Party by ID.
 * Validates path parameters, extracts tenant information, and delegates to the app service.
 *
 * @param {any} evt - The Lambda event containing HTTP request data
 * @returns {Promise<any>} Promise resolving to HTTP response with Global Party data
 * @throws {AppError} When validation fails or Global Party not found
 */
const base: HandlerFn = async (evt) => {
  const { params } = validateRequest(evt, { params: GetGlobalPartyParams });

  const tenantId = tenantFromCtx(evt);

  const c = getContainer();
  const globalPartiesQueries = makeGlobalPartiesQueriesPort({ globalParties: c.repos.globalParties });

  const result = await getGlobalPartyApp(
    {
      tenantId,
      globalPartyId: params.globalPartyId,
    },
    {
      globalPartiesQueries,
    }
  );

  return ok({ data: result.globalParty });
};

/**
 * @description Lambda handler for GET /global-parties/{globalPartyId} endpoint.
 * Wraps the base handler with authentication, observability, and CORS middleware.
 *
 * @param {any} evt - The Lambda event containing HTTP request data
 * @returns {Promise<any>} Promise resolving to HTTP response with Global Party data
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
