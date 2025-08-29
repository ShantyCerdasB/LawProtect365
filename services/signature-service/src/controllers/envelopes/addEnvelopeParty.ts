/**
 * @file AddEnvelopePartyController.controller.ts
 * @summary Controller for POST /envelopes/:envelopeId/parties
 * @description Validates input, derives tenant & actor from auth context, wires ports,
 * and delegates to the AddParty app service. Errors are mapped by apiHandler.
 */

import type { HandlerFn } from "@lawprotect/shared-ts";
import { created, validateRequest } from "@lawprotect/shared-ts";
import { wrapController, corsFromEnv } from "@/middleware/http";
import { tenantFromCtx, actorFromCtx } from "@/middleware/auth";
import { getContainer } from "@/infra/Container";
import { AddPartyPath, AddPartyBody } from "@/schemas/parties/AddParty.schema";
import { toTenantId, toEnvelopeId } from "@/app/ports/shared";
import { addPartyApp } from "@/app/services/Envelope/AddPartyApp.service";
import { makePartiesCommandsPort } from "@/app/ports/parties/MakePartiesCommandsPort";
import type { PartyRole } from "@/domain/values/enums";

/**
 * Base handler function for adding a party to an envelope
 * @param evt - The Lambda event containing HTTP request data
 * @returns Promise resolving to HTTP response with created party data
 * @throws {AppError} When validation fails or party creation fails
 */
const base: HandlerFn = async (evt) => {
  const { path, body } = validateRequest(evt, { path: AddPartyPath, body: AddPartyBody });

  const tenantId = toTenantId(tenantFromCtx(evt));
  const envelopeId = toEnvelopeId(path.envelopeId);
  const actor = actorFromCtx(evt);

  const c = getContainer();
  const partiesCommands = makePartiesCommandsPort(c.repos.parties, { ids: c.ids, time: c.time });

  const result = await addPartyApp(
    {
      tenantId,
      envelopeId,
      email: body.email,
      name: body.name,
      role: body.role as PartyRole,
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

/**
 * Lambda handler for POST /envelopes/:envelopeId/parties endpoint
 * @param evt - The Lambda event containing HTTP request data
 * @returns Promise resolving to HTTP response with created party data
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
