/**
 * @file getEnvelopeStatus.ts
 * @summary Controller for GET /envelopes/:envelopeId/status
 *
 * @description
 * Validates input and delegates to the GetEnvelopeStatus use case. Errors are mapped by apiHandler.
 */

import type { HandlerFn } from "@lawprotect/shared-ts";
import { ok, validateRequest } from "@lawprotect/shared-ts";
import { wrapController, corsFromEnv } from "@/middleware/http";
import { getContainer } from "@/infra/Container";
import { EnvelopeIdPath } from "@/schemas/common/path";
import { getEnvelopeStatus } from "@/use-cases/envelopes/GetEnvelopeStatus";
import type { EnvelopeId } from "@/domain/value-objects/Ids";

const base: HandlerFn = async (evt) => {
  const { path } = validateRequest(evt, { path: EnvelopeIdPath });

  const c = getContainer();

  const result = await getEnvelopeStatus(
    { envelopeId: path.id as EnvelopeId },
    { repos: c.repos }
  );

  return ok({ data: result });
};

export const handler = wrapController(base, {
  auth: true,
  observability: {
    logger: () => console,
    metrics: () => ({} as any),
    tracer: () => ({} as any),
  },
  cors: corsFromEnv(),
});
