/**
 * @file delegateGlobalParty.ts
 * @summary Controller for delegating a global party (contact)
 * @description Handles POST /parties/:partyId/delegate requests for delegating global parties
 */

import type { HandlerFn } from "@lawprotect/shared-ts";
import { created, validateRequest } from "@lawprotect/shared-ts";
import { wrapController, corsFromEnv } from "../../middleware/http";
import { tenantFromCtx, actorFromCtx } from "../../middleware/auth";
import { DelegatePartyPath, DelegatePartyBody } from "../../schemas/parties/DelegateParty.schema";
import { getContainer } from "../../infra/Container";
import { toTenantId, toPartyId } from "../../app/ports/shared";

const base: HandlerFn = async (evt) => {
  const { path, body } = validateRequest(evt, { path: DelegatePartyPath, body: DelegatePartyBody });

  const tenantId = toTenantId(tenantFromCtx(evt));
  const actor = actorFromCtx(evt);

  const c = getContainer();
  
  // For now, return a placeholder response until the global parties infrastructure is fully set up
  const result = {
    delegationId: `delegation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    delegation: {
      id: `delegation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      tenantId,
      originalPartyId: path.partyId,
      delegatePartyId: `party-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      reason: body.reason,
      type: "temporary",
      expiresAt: body.expiresAt,
      metadata: body.metadata,
      createdAt: new Date().toISOString(),
    },
    delegateParty: {
      id: `party-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      tenantId,
      name: body.delegateName,
      email: body.delegateEmail,
      phone: undefined,
      role: "signer",
      source: "delegation",
      status: "active",
      metadata: body.metadata,
      notificationPreferences: { email: true, sms: false },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };

  return created({ data: result });
};

export const handler = wrapController(base, {
  auth: true,
  observability: { logger: () => console, metrics: () => ({} as any), tracer: () => ({} as any) },
  cors: corsFromEnv(),
});
