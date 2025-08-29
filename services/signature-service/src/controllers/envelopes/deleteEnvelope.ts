/**
 * @file DeleteEnvelopeController.controller.ts
 * @summary Controller for DELETE /envelopes/:envelopeId
 * @description Validates input, derives tenant from auth context, wires ports,
 * and delegates to the DeleteEnvelope app service. Errors are mapped by apiHandler.
 */

import type { HandlerFn } from "@lawprotect/shared-ts";
import { noContent, validateRequest } from "@lawprotect/shared-ts";
import { wrapController, corsFromEnv } from "@/middleware/http";
import { tenantFromCtx } from "@/middleware/auth";
import { getContainer } from "@/infra/Container";
import { EnvelopeIdPath } from "@/schemas/common/path";
import { toTenantId, toEnvelopeId } from "@/app/ports/shared";
import { deleteEnvelopeApp } from "@/app/services/Envelope/DeleteEnvelopeApp.service";
import { makeEnvelopesCommandsPort } from "@/app/adapters/envelopes/makeEnvelopesCommandsPort";

/**
 * Base handler function for deleting an envelope
 * @param evt - The Lambda event containing HTTP request data
 * @returns Promise resolving to HTTP response with no content
 * @throws {AppError} When envelope is not found, validation fails, or deletion fails
 */
const base: HandlerFn = async (evt) => {
  const { path } = validateRequest(evt, { path: EnvelopeIdPath });

  const tenantId = toTenantId(tenantFromCtx(evt));
  const envelopeId = toEnvelopeId(path.id);

  const c = getContainer();
  const envelopesCommands = makeEnvelopesCommandsPort(c.repos.envelopes, { ids: c.ids });

  await deleteEnvelopeApp(
    { tenantId, envelopeId },
    { envelopesCommands }
  );

  return noContent();
};

/**
 * Lambda handler for DELETE /envelopes/:envelopeId endpoint
 * @param evt - The Lambda event containing HTTP request data
 * @returns Promise resolving to HTTP response with no content
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
