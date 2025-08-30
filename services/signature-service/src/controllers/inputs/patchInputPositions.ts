/**
 * @file PatchInputPositionsController.controller.ts
 * @summary Controller for PATCH /envelopes/{envelopeId}/inputs/positions
 * @description Validates request body and path parameters, derives tenant & actor from the shared auth context, wires ports,
 * and delegates to the PatchInputPositions app service. Errors are mapped by apiHandler.
 */

import type { HandlerFn } from "@lawprotect/shared-ts";
import { ok, validateRequest } from "@lawprotect/shared-ts";
import { wrapController, corsFromEnv } from "@/middleware/http";
import { tenantFromCtx, actorFromCtx } from "@/middleware/auth";
import { getContainer } from "@/infra/Container";
import { PatchInputPositionsBody, EnvelopePath } from "@/schemas/inputs";
import { toTenantId, toEnvelopeId } from "@/app/ports/shared";
import { patchInputPositionsApp } from "@/app/services/Inputs/PatchInputPositionsApp.service";
import { makeInputsCommandsPort } from "@/app/adapters/inputs/makeInputsCommandsPort";

/**
 * @description Base handler function for updating input positions in batch.
 * Validates request body and path parameters, extracts tenant and actor information, and delegates to the app service.
 *
 * @param {any} evt - The Lambda event containing HTTP request data
 * @returns {Promise<any>} Promise resolving to HTTP response with updated positions data
 * @throws {AppError} When validation fails or position updates fail
 */
const base: HandlerFn = async (evt) => {
  const { body } = validateRequest(evt, { body: PatchInputPositionsBody });
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

  const result = await patchInputPositionsApp(
    { 
      tenantId, 
      envelopeId, 
      items: body.items.map(item => ({
        ...item,
        width: 0, // Default width since schema doesn't include it
        height: 0, // Default height since schema doesn't include it
      })), 
      actor 
    },
    { inputsCommands, ids: c.ids },
    idempotencyKey ? { idempotencyKey } : undefined
  );

  return ok({ data: result });
};

/**
 * @description Lambda handler for PATCH /envelopes/{envelopeId}/inputs/positions endpoint.
 * Wraps the base handler with authentication, observability, and CORS middleware.
 *
 * @param {any} evt - The Lambda event containing HTTP request data
 * @returns {Promise<any>} Promise resolving to HTTP response with updated positions data
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
