/**
 * @file deleteEnvelope.ts
 * @summary HTTP controller for DELETE /envelopes/{id}
 *
 * @description
 * - Validates path.
 * - Calls delete use case.
 * - Records "envelope.deleted" audit.
 * - Returns 204.
 */
import type { HandlerFn } from "@lawprotect/shared-ts";
import { noContent, getPathParam } from "@lawprotect/shared-ts";

import { wrapController, corsFromEnv } from "@/middleware/http";
import { getContainer } from "@/infra/Container";
import { EnvelopeIdPath } from "@/schemas/common/path";
import { deleteEnvelope } from "@/use-cases/envelopes/DeleteEnvelope";
import { recordAuditEvent } from "@/use-cases/audit/RecordAuditEvent";

const base: HandlerFn = async (evt) => {
  const auth = (evt as any).ctx?.auth ?? {};
  const { repos } = getContainer();
  const path = EnvelopeIdPath.parse({ id: getPathParam(evt, "id")! });

  await deleteEnvelope(
    { tenantId: auth.tenantId, envelopeId: path.id },
    { repos }
  );

  await recordAuditEvent(
    {
      tenantId: auth.tenantId,
      envelopeId: path.id as any, // already validated by schema
      type: "envelope.deleted",
      actor: { userId: String(auth.userId ?? ""), email: String(auth.email ?? "") },
    },
    { repos }
  );

  return noContent();
};

export const handler = wrapController(base, {
  auth: true,
  observability: { logger: (b) => console, metrics: () => ({} as any), tracer: () => ({} as any) },
  cors: corsFromEnv(),
});
