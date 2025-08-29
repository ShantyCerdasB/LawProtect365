/**
 * @file patchEnvelope.ts
 * @summary Controller for PATCH /envelopes/:envelopeId
 *
 * @description
 * Validates input and delegates to the PatchEnvelope use case. Errors are mapped by apiHandler.
 */

import type { HandlerFn } from "@lawprotect/shared-ts";
import { ok, validateRequest } from "@lawprotect/shared-ts";
import { wrapController, corsFromEnv } from "@/middleware/http";
import { getContainer } from "@/infra/Container";
import { EnvelopeIdPath } from "@/schemas/common/path";
import { PatchEnvelopeBody } from "@/schemas/envelopes/PatchEnvelope.schema";
import { patchEnvelope } from "@/use-cases/envelopes/PatchEnvelope";
import type { EnvelopeId } from "@/domain/value-objects/Ids";

const base: HandlerFn = async (evt) => {
  const { path, body } = validateRequest(evt, { path: EnvelopeIdPath, body: PatchEnvelopeBody });

  const c = getContainer();

  const result = await patchEnvelope(
    { envelopeId: path.id as EnvelopeId, title: body.name },
    { repos: { envelopes: c.repos.envelopes } }
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
