/**
 * @file SubmitConsent.Controller.ts
 * @summary Controller for submitting a consent in an envelope
 * @description Handles POST /envelopes/:envelopeId/consents/:consentId/submit requests
 */

import type { HandlerFn } from "@lawprotect/shared-ts";
import { ok, validateRequest } from "@lawprotect/shared-ts";
import { wrapController, corsFromEnv } from "../../middleware/http";
import { tenantFromCtx, actorFromCtx } from "../../middleware/auth";
import { SubmitConsentPath } from "../../schemas/consents/SubmitConsent.schema";
import { submitConsentApp } from "../../app/services/Consent/SubmitConsentApp.service";
import { getContainer } from "../../infra/Container";
import { toTenantId, toEnvelopeId, toConsentId } from "../../app/ports/shared";
import { makeConsentCommandsPort } from "../../app/adapters/consent/MakeConsentCommandsPort";

const base: HandlerFn = async (evt) => {
  const { path } = validateRequest(evt, { path: SubmitConsentPath });

  const tenantId = toTenantId(tenantFromCtx(evt));
  const actor = actorFromCtx(evt);

  const c = getContainer();
  const consentCommands = makeConsentCommandsPort(c.repos.consents, c.ids);

  const result = await submitConsentApp(
    {
      tenantId,
      envelopeId: toEnvelopeId(path.envelopeId),
      consentId: toConsentId(path.consentId),
      actor,
    },
    { consentCommands }
  );

  return ok({ data: result });
};

export const handler = wrapController(base, {
  auth: true,
  observability: { logger: () => console, metrics: () => ({} as any), tracer: () => ({} as any) },
  cors: corsFromEnv(),
});
