/**
 * Controller for POST /envelopes/:envelopeId/parties
 * - Validates input
 * - Derives tenant/actor from auth context
 * - Wires app ports/services
 * - Delegates to application service
 */
import type { HandlerFn } from "@lawprotect/shared-ts";
import { created, validateRequest } from "@lawprotect/shared-ts";

import { wrapController, corsFromEnv } from "@/middleware/http";
import { tenantFromCtx, actorFromCtx } from "@/middleware/auth";
import { getContainer } from "@/infra/Container";

import { AddPartyPath, AddPartyBody } from "@/schemas/parties/AddParty.schema";
import type { PartyRole } from "@/domain/values/enums";

import { addPartyApp } from "@/app/services/AddPartyApp";
import { makePartiesCommandsPort } from "@/app/ports/parties/makePartiesCommandsPort";
import { toTenantId, toEnvelopeId } from "@/app/ports/shared/cast";

const base: HandlerFn = async (evt) => {
  const { path, body } = validateRequest(evt, { path: AddPartyPath, body: AddPartyBody });

  const tenantId   = toTenantId(tenantFromCtx(evt));
  const envelopeId = toEnvelopeId(path.envelopeId);
  const actor      = actorFromCtx(evt);

  const c = getContainer();

  const partiesCommands = makePartiesCommandsPort(c.repos.parties, { ids: c.ids, time: c.time });

  const result = await addPartyApp(
    {
      tenantId,
      envelopeId,
      email: body.email,
      name: body.name,
      role: body.role as PartyRole, // usa PARTY_ROLES
      order: body.order,
      metadata: body.metadata,
      notificationPreferences: body.notificationPreferences,
      actor,
    },
    {
      envelopes: c.repos.envelopes,
      partiesCommands,
      ids: c.ids,
    }
  );

  return created({ data: { partyId: result.partyId } });
};

export const handler = wrapController(base, {
  auth: true,
  observability: { logger: () => console, metrics: () => ({} as any), tracer: () => ({} as any) },
  cors: corsFromEnv(),
});
