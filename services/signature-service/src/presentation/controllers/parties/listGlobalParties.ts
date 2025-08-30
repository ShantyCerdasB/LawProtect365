/**
 * @file listGlobalParties.ts
 * @summary Controller for listing global parties (contacts)
 * @description Handles GET /parties requests for listing global parties in the address book
 */

import type { HandlerFn } from "@lawprotect/shared-ts";
import { ok, validateRequest } from "@lawprotect/shared-ts";
import { wrapController, corsFromEnv } from "../../presentation/middleware/http";
import { tenantFromCtx, actorFromCtx } from "../../presentation/middleware/auth";
import { ListPartiesQuery } from "../../schemas/parties/ListParties.schema";
import { getContainer } from "../../core/Container";
import { toTenantId } from "../../app/ports/shared";

const base: HandlerFn = async (evt) => {
  const { query } = validateRequest(evt, { query: ListPartiesQuery });

  const tenantId = toTenantId(tenantFromCtx(evt));
  const actor = actorFromCtx(evt);

  const c = getContainer();
  
  // For now, return a placeholder response until the global parties infrastructure is fully set up
  const result = {
    parties: [
      {
        id: `party-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        tenantId,
        name: "John Doe",
        email: "john@example.com",
        phone: "+1234567890",
        role: "signer",
        source: "manual",
        status: "active",
        metadata: {},
        notificationPreferences: { email: true, sms: false },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    pagination: {
      nextCursor: undefined,
      total: 1,
    },
  };

  return ok({ data: result });
};

export const handler = wrapController(base, {
  auth: true,
  observability: { logger: () => console, metrics: () => ({} as any), tracer: () => ({} as any) },
  cors: corsFromEnv(),
});
