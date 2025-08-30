/**
 * @file DeleteConsent.Controller.ts
 * @summary Controller for deleting a consent from an envelope
 * @description Handles DELETE /envelopes/:envelopeId/consents/:consentId requests
 */

import type { HandlerFn } from "@lawprotect/shared-ts";
import { noContent, validateRequest } from "@lawprotect/shared-ts";
import { wrapController, corsFromEnv } from "../../presentation/middleware/http";
import { tenantFromCtx } from "../../presentation/middleware/auth";
import { DeleteConsentPath } from "../../schemas/consents/DeleteConsent.schema";
import { deleteConsentApp } from "../../app/services/Consent/DeleteConsentApp.service";
import { getContainer } from "../../core/Container";
import { toTenantId, toEnvelopeId, toConsentId } from "../../app/ports/shared";
import { makeConsentCommandsPort } from "../../app/adapters/consent/MakeConsentCommandsPort";

const base: HandlerFn = async (evt) => {
  const { path } = validateRequest(evt, { path: DeleteConsentPath });
  const { envelopeId, consentId } = path;

  const tenantId = toTenantId(tenantFromCtx(evt));

  const c = getContainer();
  const consentCommands = makeConsentCommandsPort(c.repos.consents, c.ids);

  await deleteConsentApp(
    { 
      tenantId, 
      envelopeId: toEnvelopeId(envelopeId), 
      consentId: toConsentId(consentId) 
    },
    { consentCommands }
  );

  return noContent();
};

export const handler = wrapController(base, {
  auth: true,
  observability: {
    logger: () => console,
    metrics: () => ({} as any),
    tracer: () => ({} as any),
  },
  cors: corsFromEnv(),
});
