/**
 * @file GetEnvelopeStatusController.controller.ts
 * @summary Controller for GET /envelopes/:envelopeId/status
 * @description Validates input, derives tenant from auth context, wires ports,
 * and delegates to the GetEnvelopeStatus app service. Errors are mapped by apiHandler.
 */

import type { HandlerFn } from "@lawprotect/shared-ts";
import { ok, validateRequest } from "@lawprotect/shared-ts";
import { wrapController, corsFromEnv } from "@/presentation/middleware/http";
import { tenantFromCtx } from "@/presentation/middleware/auth";
import { getContainer } from "@/core/Container";
import { EnvelopeIdPath } from "@/schemas/common/path";
import { toTenantId, toEnvelopeId } from "@/app/ports/shared";
import { getEnvelopeStatusApp } from "@/app/services/Envelope/GetEnvelopeStatusApp.service";
import { makeEnvelopesQueriesPort } from "@/app/adapters/envelopes/MakeEnvelopesQueriesPort";

/**
 * Base handler function for getting envelope status
 * @param evt - The Lambda event containing HTTP request data
 * @returns Promise resolving to HTTP response with envelope status data
 * @throws {AppError} When envelope is not found or validation fails
 */
const base: HandlerFn = async (evt) => {
  const { path } = validateRequest(evt, { path: EnvelopeIdPath });

  const tenantId = toTenantId(tenantFromCtx(evt));
  const envelopeId = toEnvelopeId(path.id);

  const c = getContainer();
  const envelopesQueries = makeEnvelopesQueriesPort(c.repos.envelopes);

  const result = await getEnvelopeStatusApp(
    { tenantId, envelopeId },
    { envelopesQueries }
  );

  return ok({ data: result });
};

/**
 * Lambda handler for GET /envelopes/:envelopeId/status endpoint
 * @param evt - The Lambda event containing HTTP request data
 * @returns Promise resolving to HTTP response with envelope status data
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
