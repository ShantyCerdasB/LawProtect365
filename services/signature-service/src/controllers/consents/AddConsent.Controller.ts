/**
 * @file AddConsent.Controller.ts
 * @summary Controller for adding a new consent to an envelope
 * @description Handles POST /envelopes/:envelopeId/consents requests
 */

import type { HandlerFn } from "@lawprotect/shared-ts";
import { created, validateRequest } from "@lawprotect/shared-ts";
import { wrapController, corsFromEnv } from "../../middleware/http";
import { tenantFromCtx, actorFromCtx } from "../../middleware/auth";
import { AddConsentPath, AddConsentBody } from "../../schemas/consents/AddConsent.schema";
import { addConsentApp } from "../../app/services/Consent/AddConsentApp.service";
import { getContainer } from "../../infra/Container";
import { toTenantId, toEnvelopeId, toPartyId } from "../../app/ports/shared";
import { makeConsentCommandsPort } from "../../app/adapters/consent/MakeConsentCommandsPort";

const base: HandlerFn = async (evt) => {
  const { path, body } = validateRequest(evt, { path: AddConsentPath, body: AddConsentBody });

  const tenantId = toTenantId(tenantFromCtx(evt));
  const actor = actorFromCtx(evt);

  const c = getContainer();
  const consentCommands = makeConsentCommandsPort(c.repos.consents, c.ids);

  const result = await addConsentApp(
    {
      tenantId,
      envelopeId: toEnvelopeId(path.envelopeId),
      partyId: toPartyId(body.partyId),
      consentType: body.consentType,
      metadata: body.metadata,
      expiresAt: body.expiresAt,
      actor,
    },
    { consentCommands }
  );

  return created({ data: result });
};

export const handler = wrapController(base, {
  auth: true,
  observability: { logger: () => console, metrics: () => ({} as any), tracer: () => ({} as any) },
  cors: corsFromEnv(),
});
