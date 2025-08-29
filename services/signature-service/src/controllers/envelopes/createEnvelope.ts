/**
 * @file CreateEnvelopeController.controller.ts
 * @summary Controller for POST /envelopes
 * @description Validates input, derives tenant & actor from the shared auth context, wires ports,
 * and delegates to the CreateEnvelope app service. Errors are mapped by apiHandler.
 */

import type { HandlerFn } from "@lawprotect/shared-ts";
import { created, validateRequest } from "@lawprotect/shared-ts";
import { wrapController, corsFromEnv } from "@/middleware/http";
import { tenantFromCtx, actorFromCtx } from "@/middleware/auth";
import { getContainer } from "@/infra/Container";
import { CreateEnvelopeBody } from "@/schemas/envelopes/CreateEnvelope.schema";
import { toTenantId, toUserId } from "@/app/ports/shared";
import { createEnvelopeApp } from "@/app/services/Envelope/CreateEnvelopeApp.service";
import { makeEnvelopesCommandsPort } from "@/app/adapters/envelopes/makeEnvelopesCommandsPort";

/**
 * Base handler function for creating a new envelope
 * @param evt - The Lambda event containing HTTP request data
 * @returns Promise resolving to HTTP response with created envelope data
 * @throws {AppError} When validation fails or envelope creation fails
 */
const base: HandlerFn = async (evt) => {
  const { body } = validateRequest(evt, { body: CreateEnvelopeBody });

  const tenantId = toTenantId(tenantFromCtx(evt));
  const ownerId = toUserId(body.ownerId);
  const actor = actorFromCtx(evt);

  const c = getContainer();
  const envelopesCommands = makeEnvelopesCommandsPort(c.repos.envelopes, { ids: c.ids });

  const result = await createEnvelopeApp(
    { tenantId, ownerId, title: body.name, actor },
    { envelopesCommands, ids: c.ids }
  );

  return created({ data: { id: result.envelopeId, createdAt: result.createdAt } });
};

/**
 * Lambda handler for POST /envelopes endpoint
 * @param evt - The Lambda event containing HTTP request data
 * @returns Promise resolving to HTTP response with created envelope data
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
