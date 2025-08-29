/**
 * @file deleteEnvelope.ts
 * @summary Controller for DELETE /envelopes/:envelopeId
 *
 * @description
 * Validates input and delegates to the DeleteEnvelope use case. Errors are mapped by apiHandler.
 */

import type { HandlerFn } from "@lawprotect/shared-ts";
import { noContent, validateRequest } from "@lawprotect/shared-ts";
import { wrapController, corsFromEnv } from "@/middleware/http";
import { getContainer } from "@/infra/Container";
import { EnvelopeIdPath } from "@/schemas/common/path";
import { deleteEnvelope } from "@/use-cases/envelopes/DeleteEnvelope";
import type { EnvelopeId } from "@/domain/value-objects/Ids";

const base: HandlerFn = async (evt) => {
  const { path } = validateRequest(evt, { path: EnvelopeIdPath });

  const c = getContainer();

  await deleteEnvelope(
    { envelopeId: path.id as EnvelopeId },
    { repos: { envelopes: c.repos.envelopes } }
  );

  return noContent();
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
