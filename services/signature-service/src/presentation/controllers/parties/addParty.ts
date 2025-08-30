/**
 * @file addParty.ts
 * @description Controller for adding new Parties via POST /envelopes/{envelopeId}/parties endpoint.
 * Validates input, derives tenant and actor from auth context, and delegates to the CreateParty app service.
 */

import type { HandlerFn } from "@lawprotect/shared-ts";
import { created, validateRequest } from "@lawprotect/shared-ts";
import { wrapController, corsFromEnv } from "@/presentation/middleware/http";
import { tenantFromCtx, actorFromCtx } from "@/presentation/middleware/auth";
import { getContainer } from "@/core/Container";
import { CreatePartyParams, CreatePartyBody } from "@/schemas/parties";
import { createPartyApp } from "@/app/services/Parties/CreatePartyApp.service";
import { makePartiesCommandsPort } from "@/app/adapters/parties/MakePartiesCommandsPort";
import { makePartiesQueriesPort } from "@/app/adapters/parties/MakePartiesQueriesPort";

/**
 * @description Base handler function for adding a new Party.
 * Validates request body and path parameters, extracts tenant and actor information, and delegates to the app service.
 *
 * @param {any} evt - The Lambda event containing HTTP request data
 * @returns {Promise<any>} Promise resolving to HTTP response with created Party data
 * @throws {AppError} When validation fails or Party creation fails
 */
const base: HandlerFn = async (evt) => {
  const { path, body } = validateRequest(evt, { 
    path: CreatePartyParams,
    body: CreatePartyBody,
  });

  const tenantId = tenantFromCtx(evt);
  const actor = actorFromCtx(evt);

  const c = getContainer();
  const partiesCommands = makePartiesCommandsPort({ parties: c.repos.parties, events: c.events });
  const partiesQueries = makePartiesQueriesPort({ parties: c.repos.parties });

  const result = await createPartyApp(
    {
      tenantId,
      envelopeId: path.envelopeId,
      name: body.name,
      email: body.email,
      role: body.role,
      sequence: body.sequence,
      phone: body.phone,
      locale: body.locale,
      auth: body.auth,
      globalPartyId: body.globalPartyId,
      actor,
    },
    {
      partiesCommands,
      partiesQueries,
      idempotencyRunner: c.idempotency.runner,
    }
  );

  return created({ data: result.party });
};

/**
 * @description Lambda handler for POST /envelopes/{envelopeId}/parties endpoint.
 * Wraps the base handler with authentication, observability, and CORS middleware.
 *
 * @param {any} evt - The Lambda event containing HTTP request data
 * @returns {Promise<any>} Promise resolving to HTTP response with created Party data
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



