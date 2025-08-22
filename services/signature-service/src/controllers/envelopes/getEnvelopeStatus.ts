/**
 * @file getEnvelopeStatus.ts
 * @summary HTTP controller for GET /envelopes/{id}/status
 *
 * @description
 * - Validates path.
 * - Returns consolidated status (current lifecycle).
 * - No audit (read-only).
 */
import type { HandlerFn } from "@lawprotect/shared-ts";
import { ok, getPathParam } from "@lawprotect/shared-ts";

import { wrapController, corsFromEnv } from "@/middleware/http";
import { getContainer } from "@/infra/Container";
import { EnvelopeIdPath } from "@/schemas/common/path";
import { getEnvelopeStatus } from "@/use-cases/envelopes/GetEnvelopeStatus";

const base: HandlerFn = async (evt) => {
  const { repos } = getContainer();
  const path = EnvelopeIdPath.parse({ id: getPathParam(evt, "id")! });

  const out = await getEnvelopeStatus(
    { envelopeId: path.id },
    { repos: { envelopes: repos.envelopes } }
  );

  return ok({ data: out });
};

export const handler = wrapController(base, {
  auth: true,
  observability: { logger: (b) => console, metrics: () => ({} as any), tracer: () => ({} as any) },
  cors: corsFromEnv(),
});
