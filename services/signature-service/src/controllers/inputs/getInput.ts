/**
 * @file GetInputController.controller.ts
 * @summary Controller for GET /envelopes/{envelopeId}/inputs/{inputId}
 * @description Validates path parameters, derives tenant from the shared auth context, wires ports,
 * and delegates to the GetInput app service. Errors are mapped by apiHandler.
 */

import type { HandlerFn } from "@lawprotect/shared-ts";
import { ok } from "@lawprotect/shared-ts";
import { wrapController, corsFromEnv } from "@/middleware/http";
import { tenantFromCtx } from "@/middleware/auth";
import { getContainer } from "@/infra/Container";
import { EnvelopeInputPath } from "@/schemas/inputs";
import { toTenantId, toEnvelopeId } from "@/app/ports/shared";
import { getInputApp } from "@/app/services/Inputs/GetInputApp.service";
import { makeInputsQueriesPort } from "@/app/adapters/inputs/makeInputsQueriesPort";

/**
 * @description Base handler function for getting a single input.
 * Validates path parameters, extracts tenant information, and delegates to the app service.
 *
 * @param {any} evt - The Lambda event containing HTTP request data
 * @returns {Promise<any>} Promise resolving to HTTP response with input data
 * @throws {AppError} When validation fails or input retrieval fails
 */
const base: HandlerFn = async (evt) => {
  const params = EnvelopeInputPath.parse(evt.pathParameters);

  const tenantId = toTenantId(tenantFromCtx(evt));
  const envelopeId = toEnvelopeId(params.envelopeId);
  const inputId = params.inputId;

  const c = getContainer();
  const inputsQueries = makeInputsQueriesPort(c.repos.inputs);

  const result = await getInputApp(
    { 
      tenantId, 
      envelopeId, 
      inputId 
    },
    { inputsQueries }
  );

  return ok({ data: result });
};

/**
 * @description Lambda handler for GET /envelopes/{envelopeId}/inputs/{inputId} endpoint.
 * Wraps the base handler with authentication, observability, and CORS middleware.
 *
 * @param {any} evt - The Lambda event containing HTTP request data
 * @returns {Promise<any>} Promise resolving to HTTP response with input data
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
