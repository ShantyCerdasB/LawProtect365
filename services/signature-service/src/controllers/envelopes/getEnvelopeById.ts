/**
 * @file getEnvelopeById.ts
 * @summary Controller for GET /envelopes/:envelopeId
 *
 * @description
 * Validates input and delegates to the GetEnvelopeById use case. Errors are mapped by apiHandler.
 */

import type { HandlerFn } from "@lawprotect/shared-ts";
import { ok, validateRequest } from "@lawprotect/shared-ts";
import { wrapController, corsFromEnv } from "@/middleware/http";
import { getContainer } from "@/infra/Container";
import { EnvelopeIdPath } from "@/schemas/common/path";
import { getEnvelopeById } from "@/use-cases/envelopes/GetEnvelopeById";
import type { EnvelopeId } from "@/domain/value-objects/Ids";

const base: HandlerFn = async (evt) => {
  const { path } = validateRequest(evt, { path: EnvelopeIdPath });

  const c = getContainer();

  const result = await getEnvelopeById(
    { envelopeId: path.id as EnvelopeId },
    { repos: c.repos }
  );

  return ok({ data: result.envelope });
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
