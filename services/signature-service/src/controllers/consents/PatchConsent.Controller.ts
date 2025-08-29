/**
 * @file PatchConsent.Controller.ts
 * @summary Controller for patching a consent in an envelope
 * @description Handles PATCH /envelopes/:envelopeId/consents/:consentId requests
 */

import type { HandlerFn } from "@lawprotect/shared-ts";
import { ok, validateRequest } from "@lawprotect/shared-ts";
import { wrapController, corsFromEnv } from "../../middleware/http";
import { tenantFromCtx } from "../../middleware/auth";
import { PatchConsentPath, PatchConsentBody } from "../../schemas/consents/PatchConsent.schema";
import { patchConsentApp } from "../../app/services/Consent/PatchConsentApp.service";
import { getContainer } from "../../infra/Container";
import { toTenantId, toEnvelopeId, toConsentId } from "../../app/ports/shared";
import { makeConsentCommandsPort } from "../../app/adapters/consent/MakeConsentCommandsPort";

const base: HandlerFn = async (evt) => {
  const { path, body } = validateRequest(evt, { path: PatchConsentPath, body: PatchConsentBody });

  const tenantId = toTenantId(tenantFromCtx(evt));

  const c = getContainer();
  const consentCommands = makeConsentCommandsPort(c.repos.consents, c.ids);

  const result = await patchConsentApp(
    {
      tenantId,
      envelopeId: toEnvelopeId(path.envelopeId),
      consentId: toConsentId(path.consentId),
      status: body.status,
      metadata: body.metadata,
      expiresAt: body.expiresAt,
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
