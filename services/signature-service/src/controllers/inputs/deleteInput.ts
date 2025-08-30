/**
 * @file DeleteInputController.controller.ts
 * @summary Controller for DELETE /envelopes/{envelopeId}/inputs/{inputId}
 * @description Validates path parameters, derives tenant & actor from the shared auth context, wires ports,
 * and delegates to the DeleteInput app service. Errors are mapped by apiHandler.
 */

import type { HandlerFn } from "@lawprotect/shared-ts";
import { noContent } from "@lawprotect/shared-ts";
import { wrapController, corsFromEnv } from "@/middleware/http";
import { tenantFromCtx, actorFromCtx } from "@/middleware/auth";
import { getContainer } from "@/infra/Container";
import { EnvelopeInputPath } from "@/schemas/inputs";
import { toTenantId, toEnvelopeId } from "@/app/ports/shared";
import { deleteInputApp } from "@/app/services/Inputs/DeleteInputApp.service";
import { makeInputsCommandsPort } from "@/app/adapters/inputs/makeInputsCommandsPort";

/**
 * @description Base handler function for deleting an input.
 * Validates path parameters, extracts tenant and actor information, and delegates to the app service.
 *
 * @param {any} evt - The Lambda event containing HTTP request data
 * @returns {Promise<any>} Promise resolving to HTTP response with no content
 * @throws {AppError} When validation fails or input deletion fails
 */
const base: HandlerFn = async (evt) => {
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

  await deleteInputApp(
    { 
      tenantId, 
      envelopeId, 
      inputId, 
      actor 
    },
    { inputsCommands, ids: c.ids },
    idempotencyKey ? { idempotencyKey } : undefined
  );

  return noContent();
};

/**
 * @description Lambda handler for DELETE /envelopes/{envelopeId}/inputs/{inputId} endpoint.
 * Wraps the base handler with authentication, observability, and CORS middleware.
 *
 * @param {any} evt - The Lambda event containing HTTP request data
 * @returns {Promise<any>} Promise resolving to HTTP response with no content
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
