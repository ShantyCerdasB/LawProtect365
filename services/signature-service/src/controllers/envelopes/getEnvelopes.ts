/**
 * @file GetEnvelopesController.controller.ts
 * @summary Controller for GET /envelopes
 * @description Validates input, derives tenant from the shared auth context, wires ports,
 * and delegates to the ListEnvelopes app service. Errors are mapped by apiHandler.
 */

import type { HandlerFn } from "@lawprotect/shared-ts";
import { ok, validateRequest } from "@lawprotect/shared-ts";
import { wrapController, corsFromEnv } from "@/middleware/http";
import { tenantFromCtx } from "@/middleware/auth";
import { getContainer } from "@/infra/Container";
import { ListEnvelopesQuery } from "@/schemas/envelopes/ListEnvelopes.schema";
import { toTenantId } from "@/app/ports/shared";
import { listEnvelopesApp } from "@/app/services/Envelope/ListEnvelopesApp.service";
import { makeEnvelopesQueriesPort } from "@/app/adapters/envelopes/MakeEnvelopesQueriesPort";

/**
 * Base handler function for listing envelopes
 * @param evt - The Lambda event containing HTTP request data
 * @returns Promise resolving to HTTP response with paginated envelope list
 * @throws {AppError} When validation fails or query fails
 */
const base: HandlerFn = async (evt) => {
  const { query } = validateRequest(evt, { query: ListEnvelopesQuery });

  const tenantId = toTenantId(tenantFromCtx(evt));

  const c = getContainer();
  const envelopesQueries = makeEnvelopesQueriesPort(c.repos.envelopes);

  const page = await listEnvelopesApp(
    { tenantId, limit: query.limit, cursor: query.cursor },
    { envelopesQueries }
  );

  const items = page.items.map((envelope) => ({
    id: envelope.envelopeId,
    title: envelope.title,
    status: envelope.status,
    createdAt: envelope.createdAt,
  }));

  return ok({ data: { items, nextCursor: page.nextCursor } });
};

/**
 * Lambda handler for GET /envelopes endpoint
 * @param evt - The Lambda event containing HTTP request data
 * @returns Promise resolving to HTTP response with paginated envelope list
 */
export const handler = wrapController(base, {
  auth: true,
  observability: {
    logger: () => console,
    metrics: () => ({} as any),
    tracer: () => ({} as any),
  },
  cors: corsFromEnv(),
});
