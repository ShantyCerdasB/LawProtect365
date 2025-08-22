/**
 * @file getEnvelopeById.ts
 * @summary HTTP controller for GET /envelopes/{id}
 *
 * @description
 * - Validates path with `EnvelopeIdPath`.
 * - Calls use case; returns 404 when missing.
 * - No audit (read-only).
 */
import type { HandlerFn } from "@lawprotect/shared-ts";
import { ok, notFound, getPathParam } from "@lawprotect/shared-ts";

import { wrapController, corsFromEnv } from "@/middleware/http";
import { getContainer } from "@/infra/Container";
import { EnvelopeIdPath } from "@/schemas/common/path";
import { getEnvelopeById } from "@/use-cases/envelopes/GetEnvelopeById";

const base: HandlerFn = async (evt) => {
  const auth = (evt as any).ctx?.auth ?? {};
  const { repos } = getContainer();

  const path = EnvelopeIdPath.parse({ id: getPathParam(evt, "id")! });

  const out = await getEnvelopeById(
    { tenantId: auth.tenantId, envelopeId: path.id },
    { repos }
  );

  if (!out) return notFound("Envelope not found");
  return ok({ data: out.envelope });
};

export const handler = wrapController(base, {
  auth: true,
  observability: { logger: (b) => console, metrics: () => ({} as any), tracer: () => ({} as any) },
  cors: corsFromEnv(),
});
