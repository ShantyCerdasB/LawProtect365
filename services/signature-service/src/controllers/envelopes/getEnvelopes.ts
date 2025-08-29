/**
 * @file getEnvelopes.ts
 * @summary Controller for GET /envelopes
 *
 * @description
 * Validates input, derives tenant from the shared auth context, wires ports,
 * and delegates to the ListEnvelopes use case. Errors are mapped by apiHandler.
 */

import type { HandlerFn } from "@lawprotect/shared-ts";
import { ok, validateRequest } from "@lawprotect/shared-ts";
import { wrapController, corsFromEnv } from "@/middleware/http";
import { tenantFromCtx } from "@/middleware/auth";
import { getContainer } from "@/infra/Container";
import { ListEnvelopesQuery } from "@/schemas/envelopes/ListEnvelopes.schema";
import { listEnvelopes } from "@/use-cases/envelopes/ListEnvelopes";
import type { TenantId } from "@/domain/value-objects/Ids";

const base: HandlerFn = async (evt) => {
  const { query } = validateRequest(evt, { query: ListEnvelopesQuery });

  const tenantId = tenantFromCtx(evt) as TenantId;

  const c = getContainer();

  const page = await listEnvelopes(
    { tenantId, limit: query.limit, cursor: query.cursor },
    { repos: { envelopes: c.repos.envelopes } }
  );

  const items = page.items.map((envelope) => ({
    id: envelope.envelopeId,
    title: envelope.title,
    status: envelope.status,
    createdAt: envelope.createdAt,
  }));

  return ok({ data: { items, nextCursor: page.nextCursor } });
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
