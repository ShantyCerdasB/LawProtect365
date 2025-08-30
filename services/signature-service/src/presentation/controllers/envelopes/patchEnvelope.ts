/**
 * @file PatchEnvelopeController.controller.ts
 * @summary Controller for PATCH /envelopes/:envelopeId
 * @description Validates input, derives tenant from auth context, wires ports,
 * and delegates to the PatchEnvelope app service. Errors are mapped by apiHandler.
 */

import type { HandlerFn } from "@lawprotect/shared-ts";
import { ok, validateRequest } from "@lawprotect/shared-ts";
import { wrapController, corsFromEnv } from "@/presentation/middleware/http";
import { tenantFromCtx } from "@/presentation/middleware/auth";
import { getContainer } from "@/core/Container";
import { EnvelopeIdPath } from "@/schemas/common/path";
import { PatchEnvelopeBody } from "@/schemas/envelopes/PatchEnvelope.schema";
import { toTenantId, toEnvelopeId } from "@/app/ports/shared";
import { makeEnvelopesCommandsPort } from "@/app/adapters/envelopes/makeEnvelopesCommandsPort";
import { patchEnvelopeApp } from "@/app/services/Envelope/PatchEnvelopeApp.service";

/**
 * Base handler function for patching an envelope
 * @param evt - The Lambda event containing HTTP request data
 * @returns Promise resolving to HTTP response with updated envelope data
 * @throws {AppError} When envelope is not found, validation fails, or update fails
 */
const base: HandlerFn = async (evt) => {
  const { path, body } = validateRequest(evt, { path: EnvelopeIdPath, body: PatchEnvelopeBody });

  const tenantId = toTenantId(tenantFromCtx(evt));
  const envelopeId = toEnvelopeId(path.id);

  const c = getContainer();
  const envelopesCommands = makeEnvelopesCommandsPort(c.repos.envelopes, { ids: c.ids });

  const result = await patchEnvelopeApp(
    { tenantId, envelopeId, title: body.name, status: body.status },
    { envelopesCommands }
  );

  return ok({ data: result.envelope });
};

/**
 * Lambda handler for PATCH /envelopes/:envelopeId endpoint
 * @param evt - The Lambda event containing HTTP request data
 * @returns Promise resolving to HTTP response with updated envelope data
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
