/**
 * @file DelegateConsent.Controller.ts
 * @summary Controller for delegating a consent to another party
 * @description Handles POST /envelopes/:envelopeId/consents/:consentId/delegate requests
 */

import type { HandlerFn } from "@lawprotect/shared-ts";
import { created, validateRequest } from "@lawprotect/shared-ts";
import { wrapController, corsFromEnv } from "../../middleware/http";
import { tenantFromCtx, actorFromCtx } from "../../middleware/auth";
import { DelegateConsentPath, DelegateConsentBody } from "../../schemas/consents/DelegateConsent.schema";
import { delegateConsentApp } from "../../app/services/Consent/DelegateConsentApp.service";
import { getContainer } from "../../infra/Container";
import { toTenantId, toEnvelopeId, toConsentId } from "../../app/ports/shared";
import { makeConsentCommandsPort } from "../../app/adapters/consent/MakeConsentCommandsPort";

const base: HandlerFn = async (evt) => {
  const { path, body } = validateRequest(evt, { path: DelegateConsentPath, body: DelegateConsentBody });
  const tenantId = toTenantId(tenantFromCtx(evt));
  const actor = actorFromCtx(evt);

  const c = getContainer();
  const consentCommands = makeConsentCommandsPort(c.repos.consents, c.ids);

  // Get the delegate party information to extract email and name
  const delegateParty = await c.repos.parties.getById({
    envelopeId: path.envelopeId,
    partyId: body.delegatePartyId,
  });

  if (!delegateParty) {
    throw new Error(`Delegate party ${body.delegatePartyId} not found in envelope ${path.envelopeId}`);
  }

  const result = await delegateConsentApp(
    {
      tenantId,
      envelopeId: toEnvelopeId(path.envelopeId),
      consentId: toConsentId(path.consentId),
      delegateEmail: delegateParty.email,
      delegateName: delegateParty.name,
      reason: body.reason,
      expiresAt: body.expiresAt,
      metadata: body.metadata,
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
