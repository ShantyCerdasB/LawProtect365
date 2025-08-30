/**
 * @file createGlobalParty.ts
 * @description Controller for creating new Global Parties via POST /global-parties endpoint.
 * Validates input, derives tenant and actor from auth context, and delegates to the CreateGlobalParty app service.
 */

import type { HandlerFn } from "@lawprotect/shared-ts";
import { created, validateRequest } from "@lawprotect/shared-ts";
import { wrapController, corsFromEnv } from "@/presentation/middleware/http";
import { tenantFromCtx, actorFromCtx } from "@/presentation/middleware/auth";
import { getContainer } from "@/core/Container";
import { CreateGlobalPartyBody } from "@/schemas/global-parties";
import { createGlobalPartyApp } from "@/app/services/GlobalParties/CreateGlobalPartyApp.service";
import { makeGlobalPartiesCommandsPort } from "@/app/adapters/global-parties/MakeGlobalPartiesCommandsPort";
import { makeGlobalPartiesQueriesPort } from "@/app/adapters/global-parties/MakeGlobalPartiesQueriesPort";

/**
 * @description Base handler function for creating a new Global Party.
 * Validates request body, extracts tenant and actor information, and delegates to the app service.
 *
 * @param {any} evt - The Lambda event containing HTTP request data
 * @returns {Promise<any>} Promise resolving to HTTP response with created Global Party data
 * @throws {AppError} When validation fails or Global Party creation fails
 */
const base: HandlerFn = async (evt) => {
  const { body } = validateRequest(evt, { body: CreateGlobalPartyBody });

  const tenantId = tenantFromCtx(evt);
  const actor = actorFromCtx(evt);

  const c = getContainer();
  const globalPartiesCommands = makeGlobalPartiesCommandsPort({ globalParties: c.repos.globalParties, events: c.events });
  const globalPartiesQueries = makeGlobalPartiesQueriesPort({ globalParties: c.repos.globalParties });

  const result = await createGlobalPartyApp(
    {
      tenantId,
      name: body.name,
      email: body.email,
      emails: body.emails,
      phone: body.phone,
      locale: body.locale,
      role: body.role,
      source: body.source,
      tags: body.tags,
      attributes: body.attributes,
      preferences: body.preferences,
      notificationPreferences: body.notificationPreferences,
      actor,
    },
    {
      globalPartiesCommands,
      globalPartiesQueries,
      idempotencyRunner: c.idempotency.runner,
    }
  );

  return created({ data: result.globalParty });
};

/**
 * @description Lambda handler for POST /global-parties endpoint.
 * Wraps the base handler with authentication, observability, and CORS middleware.
 *
 * @param {any} evt - The Lambda event containing HTTP request data
 * @returns {Promise<any>} Promise resolving to HTTP response with created Global Party data
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
