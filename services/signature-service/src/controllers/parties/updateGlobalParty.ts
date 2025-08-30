/**
 * @file updateGlobalParty.ts
 * @summary Controller for updating a global party (contact)
 * @description Handles PATCH /parties/:partyId requests for updating global parties in the address book
 */

import type { HandlerFn } from "@lawprotect/shared-ts";
import { ok, validateRequest } from "@lawprotect/shared-ts";
import { wrapController, corsFromEnv } from "../../middleware/http";
import { tenantFromCtx, actorFromCtx } from "../../middleware/auth";
import { UpdatePartyPath, UpdatePartyBody } from "../../schemas/parties/UpdateParty.schema";
import { getContainer } from "../../infra/Container";
import { toTenantId, toPartyId } from "../../app/ports/shared";

const base: HandlerFn = async (evt) => {
  const { path, body } = validateRequest(evt, { path: UpdatePartyPath, body: UpdatePartyBody });

  const tenantId = toTenantId(tenantFromCtx(evt));
  const actor = actorFromCtx(evt);

  const c = getContainer();
  
  // For now, return a placeholder response until the global parties infrastructure is fully set up
  const result = {
    party: {
      id: path.partyId,
      tenantId,
      name: body.name?.toString() || "Updated Name",
      email: "party@example.com",
      phone: body.phone?.toString(),
      role: body.role || "signer",
      source: "manual",
      status: "active",
      metadata: body.metadata,
      notificationPreferences: body.notificationPreferences || { email: true, sms: false },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };

  return ok({ data: result });
};

export const handler = wrapController(base, {
  auth: true,
  observability: { logger: () => console, metrics: () => ({} as any), tracer: () => ({} as any) },
  cors: corsFromEnv(),
});
