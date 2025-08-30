/**
 * @file listInputs.ts
 * @description Controller for listing inputs via GET /envelopes/{envelopeId}/inputs endpoint.
 * Validates query parameters, derives tenant from auth context, and delegates to the ListInputs app service.
 */

/**
 * @file ListInputsController.controller.ts
 * @summary Controller for GET /envelopes/{envelopeId}/inputs
 * @description Validates query parameters, derives tenant from the shared auth context, wires ports,
 * and delegates to the ListInputs app service. Errors are mapped by apiHandler.
 */

import type { HandlerFn } from "@lawprotect/shared-ts";
import { ok, validateRequest } from "@lawprotect/shared-ts";
import { wrapController, corsFromEnv } from "@/middleware/http";
import { tenantFromCtx } from "@/middleware/auth";
import { getContainer } from "@/infra/Container";
import { ListInputsQuery, EnvelopePath } from "@/schemas/inputs";
import { toTenantId, toEnvelopeId } from "@/app/ports/shared";
import { listInputsApp } from "@/app/services/Inputs/ListInputsApp.service";
import { makeInputsQueriesPort } from "@/app/adapters/inputs/makeInputsQueriesPort";

/**
 * @description Base handler function for listing inputs.
 * Validates query parameters and path parameters, extracts tenant information, and delegates to the app service.
 *
 * @param {any} evt - The Lambda event containing HTTP request data
 * @returns {Promise<any>} Promise resolving to HTTP response with inputs list data
 * @throws {AppError} When validation fails or input listing fails
 */
const base: HandlerFn = async (evt) => {
  const { query } = validateRequest(evt, { query: ListInputsQuery });
  const params = EnvelopePath.parse(evt.pathParameters);

  const tenantId = toTenantId(tenantFromCtx(evt));
  const envelopeId = toEnvelopeId(params.envelopeId);

  const c = getContainer();
  const inputsQueries = makeInputsQueriesPort(c.repos.inputs);

  const result = await listInputsApp(
    { 
      tenantId, 
      envelopeId, 
      limit: query.limit, 
      cursor: query.cursor 
    },
    { inputsQueries }
  );

  return ok({ data: result });
};

/**
 * @description Lambda handler for GET /envelopes/{envelopeId}/inputs endpoint.
 * Wraps the base handler with authentication, observability, and CORS middleware.
 *
 * @param {any} evt - The Lambda event containing HTTP request data
 * @returns {Promise<any>} Promise resolving to HTTP response with inputs list data
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
