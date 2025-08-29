/**
 * @file createEnvelope.ts
 * @summary Controller for POST /envelopes
 *
 * @description
 * Validates input, derives tenant & actor from the shared auth context, wires ports,
 * and delegates to the CreateEnvelope use case. Errors are mapped by apiHandler.
 */

import type { HandlerFn } from "@lawprotect/shared-ts";
import { created, validateRequest } from "@lawprotect/shared-ts";
import { wrapController, corsFromEnv } from "@/middleware/http";
import { tenantFromCtx, actorFromCtx } from "@/middleware/auth";
import { getContainer } from "@/infra/Container";
import { CreateEnvelopeBody } from "@/schemas/envelopes/CreateEnvelope.schema";
import { createEnvelope } from "@/use-cases/envelopes/CreateEnvelope";
import type { TenantId, UserId } from "@/domain/value-objects/Ids";

const base: HandlerFn = async (evt) => {
  const { body } = validateRequest(evt, { body: CreateEnvelopeBody });

  const tenantId = tenantFromCtx(evt) as TenantId;
  const actor = actorFromCtx(evt);

  const c = getContainer();

  const result = await createEnvelope(
    { tenantId, ownerId: body.ownerId as UserId, title: body.name, actor },
    { repos: { envelopes: c.repos.envelopes }, ids: c.ids }
  );

  return created({ data: { id: result.envelope.envelopeId, createdAt: result.envelope.createdAt } });
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
