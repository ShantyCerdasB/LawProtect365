/**
 * @file patchEnvelope.ts
 * @summary HTTP controller for PATCH /envelopes/{id}
 *
 * @description
 * - Validates path and body.
 * - Calls the patch use case.
 * - Records "envelope.updated" audit with the changed fields (not the full entity).
 */
import type { HandlerFn } from "@lawprotect/shared-ts";
import { ok, getJsonBody, getPathParam } from "@lawprotect/shared-ts";

import { wrapController, corsFromEnv } from "@/middleware/http";
import { getContainer } from "@/infra/Container";
import { EnvelopeIdPath } from "@/schemas/common/path";
import { PatchEnvelopeBody } from "@/schemas/envelopes/PatchEnvelope.schema";
import { patchEnvelope } from "@/use-cases/envelopes/PatchEnvelope";
import { recordAuditEvent } from "@/use-cases/audit/RecordAuditEvent";

const base: HandlerFn = async (evt) => {
  const auth = (evt as any).ctx?.auth ?? {};
  const { repos } = getContainer();

  const path = EnvelopeIdPath.parse({ id: getPathParam(evt, "id")! });
  const body = PatchEnvelopeBody.parse(getJsonBody(evt));

  const out = await patchEnvelope(
    { tenantId: auth.tenantId, envelopeId: path.id, patch: body },
    { repos }
  );

  await recordAuditEvent(
    {
      tenantId: auth.tenantId,
      envelopeId: out.envelope.envelopeId,
      type: "envelope.updated",
      actor: { userId: String(auth.userId ?? ""), email: String(auth.email ?? "") },
      metadata: body, // keep minimal; avoid large diffs in audit
    },
    { repos }
  );

  return ok({ data: out.envelope });
};

export const handler = wrapController(base, {
  auth: true,
  observability: { logger: (b) => console, metrics: () => ({} as any), tracer: () => ({} as any) },
  cors: corsFromEnv(),
});
