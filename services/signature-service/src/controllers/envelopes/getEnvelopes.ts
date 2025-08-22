/**
 * @file getEnvelopes.ts
 * @summary HTTP controller for GET /envelopes
 *
 * @description
 * - Parses filters/pagination using `ListEnvelopesQuery`.
 * - Delegates to repo `listByTenant` (forward cursor).
 * - Returns items and nextCursor in `meta`.
 * - No audit (read-only).
 */
import type { HandlerFn } from "@lawprotect/shared-ts";
import { ok, getQueryParam } from "@lawprotect/shared-ts";

import { wrapController, corsFromEnv } from "@/middleware/http";
import { getContainer } from "@/infra/Container";
import { ListEnvelopesQuery } from "@/schemas/envelopes/ListEnvelopes.schema";

const base: HandlerFn = async (evt) => {
  const auth = (evt as any).ctx?.auth ?? {};
  const { repos } = getContainer();

  const statusParams =
    evt.multiValueQueryStringParameters?.status ??
    (evt.queryStringParameters?.status ? [evt.queryStringParameters.status] : []);

  const query = ListEnvelopesQuery.parse({
    status: statusParams && statusParams.length ? statusParams : undefined,
    from: getQueryParam(evt, "from"),
    to: getQueryParam(evt, "to"),
    limit: Number(getQueryParam(evt, "limit") ?? "25"),
    cursor: getQueryParam(evt, "cursor") ?? undefined,
  });

  const page = await repos.envelopes.listByTenant({
    tenantId: auth.tenantId,
    limit: query.limit,
    cursor: query.cursor ?? undefined,
  });

  return ok({ data: page.items, meta: { nextCursor: page.nextCursor ?? null } });
};

export const handler = wrapController(base, {
  auth: true,
  observability: { logger: (b) => console, metrics: () => ({} as any), tracer: () => ({} as any) },
  cors: corsFromEnv(),
});
