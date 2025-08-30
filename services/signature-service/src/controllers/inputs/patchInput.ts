/**
 * @file PatchInputController.controller.ts
 * @summary Controller for PATCH /envelopes/{envelopeId}/inputs/{inputId}
 * @description Validates request body and path parameters, derives tenant & actor from the shared auth context, wires ports,
 * and delegates to the PatchInput app service. Errors are mapped by apiHandler.
 */

import type { HandlerFn } from "@lawprotect/shared-ts";
import { ok, validateRequest } from "@lawprotect/shared-ts";
import { wrapController, corsFromEnv } from "@/middleware/http";
import { tenantFromCtx, actorFromCtx } from "@/middleware/auth";
import { getContainer } from "@/infra/Container";
import { PatchInputBody, EnvelopeInputPath } from "@/schemas/inputs";
import { toTenantId, toEnvelopeId } from "@/app/ports/shared";
import { patchInputApp } from "@/app/services/Inputs/PatchInputApp.service";
import { makeInputsCommandsPort } from "@/app/adapters/inputs/makeInputsCommandsPort";

/**
 * @description Base handler function for updating an input.
 * Validates request body and path parameters, extracts tenant and actor information, and delegates to the app service.
 *
 * @param {any} evt - The Lambda event containing HTTP request data
 * @returns {Promise<any>} Promise resolving to HTTP response with updated input data
 * @throws {AppError} When validation fails or input update fails
 */
const base: HandlerFn = async (evt) => {
  const { body } = validateRequest(evt, { body: PatchInputBody });
  const params = EnvelopeInputPath.parse(evt.pathParameters);

  const tenantId = toTenantId(tenantFromCtx(evt));
  const envelopeId = toEnvelopeId(params.envelopeId);
  const inputId = params.inputId;
  const actor = actorFromCtx(evt);

  // Extract idempotency key from headers if present
  const idempotencyKey = evt.headers?.["x-idempotency-key"] || evt.headers?.["X-Idempotency-Key"];

  const c = getContainer();
  const inputsCommands = makeInputsCommandsPort(
    c.repos.inputs, 
    c.repos.envelopes, 
    { ids: c.ids }
  );

  const result = await patchInputApp(
    { 
      tenantId, 
      envelopeId, 
      inputId, 
      updates: body, 
      actor 
    },
    { inputsCommands, ids: c.ids },
    idempotencyKey ? { idempotencyKey } : undefined
  );

  return ok({ data: result });
};

/**
 * @description Lambda handler for PATCH /envelopes/{envelopeId}/inputs/{inputId} endpoint.
 * Wraps the base handler with authentication, observability, and CORS middleware.
 *
 * @param {any} evt - The Lambda event containing HTTP request data
 * @returns {Promise<any>} Promise resolving to HTTP response with updated input data
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
