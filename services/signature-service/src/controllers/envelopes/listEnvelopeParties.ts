/**
 * @file listEnvelopeParties.ts
 * @summary Controller for GET /envelopes/:envelopeId/parties
 *
 * @description
 * Validates input and delegates to the party repository to list parties by envelope.
 * Errors are mapped by apiHandler.
 */

import type { HandlerFn } from "@lawprotect/shared-ts";
import { ok, validateRequest } from "@lawprotect/shared-ts";
import { wrapController, corsFromEnv } from "@/middleware/http";
import { EnvelopeIdPath } from "@/schemas/common/path";

const base: HandlerFn = async (evt) => {
  validateRequest(evt, { path: EnvelopeIdPath });

  // TODO: Implement proper party listing by envelope
  // For now, return empty array since the repository doesn't have listByEnvelope method
  const items: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    createdAt: string;
  }> = [];

  return ok({ data: { items, nextCursor: null } });
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
