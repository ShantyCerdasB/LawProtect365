/**
 * @file deleteGlobalParty.ts
 * @summary Controller for deleting a global party (contact)
 * @description Handles DELETE /parties/:partyId requests for deleting global parties from the address book
 */

import type { HandlerFn } from "@lawprotect/shared-ts";
import { ok, validateRequest } from "@lawprotect/shared-ts";
import { wrapController, corsFromEnv } from "../../middleware/http";
import { tenantFromCtx, actorFromCtx } from "../../middleware/auth";
import { DeletePartyPath } from "../../schemas/parties/DeleteParty.schema";
import { getContainer } from "../../infra/Container";
import { toTenantId, toPartyId } from "../../app/ports/shared";

const base: HandlerFn = async (evt) => {
  const { path } = validateRequest(evt, { path: DeletePartyPath });

  const tenantId = toTenantId(tenantFromCtx(evt));
  const actor = actorFromCtx(evt);

  const c = getContainer();
  
  // For now, return a placeholder response until the global parties infrastructure is fully set up
  const result = {
    deleted: true,
    partyId: path.partyId,
    deletedAt: new Date().toISOString(),
  };

  return ok({ data: result });
};

export const handler = wrapController(base, {
  auth: true,
  observability: { logger: () => console, metrics: () => ({} as any), tracer: () => ({} as any) },
  cors: corsFromEnv(),
});
