/**
 * @file CreateInputsController.controller.ts
 * @summary Controller for POST /envelopes/{envelopeId}/inputs
 * @description Validates input, derives tenant & actor from the shared auth context, wires ports,
 * and delegates to the CreateInputs app service. Errors are mapped by apiHandler.
 */

import type { HandlerFn } from "@lawprotect/shared-ts";
import { created, validateRequest } from "@lawprotect/shared-ts";
import { wrapController, corsFromEnv } from "@/presentation/middleware/http";
import { tenantFromCtx, actorFromCtx } from "@/presentation/middleware/auth";
import { getContainer } from "@/core/Container";
import { CreateInputsBody, EnvelopePath } from "@/schemas/inputs";
import { toTenantId, toEnvelopeId } from "@/app/ports/shared";
import { createInputsApp } from "@/app/services/Inputs/CreateInputsApp.service";
import { makeInputsCommandsPort } from "@/app/adapters/inputs/makeInputsCommandsPort";

/**
 * @description Base handler function for creating inputs in batch.
 * Validates request body and path parameters, extracts tenant and actor information, and delegates to the app service.
 *
 * @param {any} evt - The Lambda event containing HTTP request data
 * @returns {Promise<any>} Promise resolving to HTTP response with created inputs data
 * @throws {AppError} When validation fails or input creation fails
 */
const base: HandlerFn = async (evt) => {
  const { body } = validateRequest(evt, { body: CreateInputsBody });
  const params = EnvelopePath.parse(evt.pathParameters);

  const tenantId = toTenantId(tenantFromCtx(evt));
  const envelopeId = toEnvelopeId(params.envelopeId);
  const actor = actorFromCtx(evt);

  // Extract idempotency key from headers if present
  const idempotencyKey = evt.headers?.["x-idempotency-key"] || evt.headers?.["X-Idempotency-Key"];

  const c = getContainer();
  const inputsCommands = makeInputsCommandsPort(
    c.repos.inputs, 
    c.repos.envelopes, 
    { ids: c.ids }
  );

  const result = await createInputsApp(
    { 
      tenantId, 
      envelopeId, 
      documentId: body.documentId, 
      inputs: body.inputs.map(input => ({
        ...input,
        width: 0, // Default width since schema doesn't include it
        height: 0, // Default height since schema doesn't include it
      })), 
      actor 
    },
    { inputsCommands, ids: c.ids },
    idempotencyKey ? { idempotencyKey } : undefined
  );

  return created({ data: result });
};

/**
 * @description Lambda handler for POST /envelopes/{envelopeId}/inputs endpoint.
 * Wraps the base handler with authentication, observability, and CORS middleware.
 *
 * @param {any} evt - The Lambda event containing HTTP request data
 * @returns {Promise<any>} Promise resolving to HTTP response with created inputs data
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
