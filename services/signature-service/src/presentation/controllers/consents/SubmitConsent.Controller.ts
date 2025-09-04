/**
 * @file SubmitConsent.Controller.ts
 * @summary Controller for submitting a consent
 * @description Handles POST /envelopes/:envelopeId/consents/:consentId/submit requests using command controller factory
 */

import { createCommandController } from "../../../shared/controllers/controllerFactory";
import { makeConsentCommandsPort } from "../../../app/adapters/consent/MakeConsentCommandsPort";
import { ConsentCommandService } from "../../../app/services/Consent/ConsentCommandService";
import type { SubmitConsentControllerInput } from "../../../shared/types/consent/ControllerInputs";
import type { SubmitConsentAppResult } from "../../../shared/types/consent/AppServiceInputs";
import { UpdateConsentPath } from "../../schemas/consents/UpdateConsent.schema";
import type { EnvelopeId, ConsentId } from "../../../domain/value-objects/Ids";

export const handler = createCommandController<SubmitConsentControllerInput, SubmitConsentAppResult>({
  pathSchema: UpdateConsentPath,
  appServiceClass: ConsentCommandService,
  createDependencies: (c) => makeConsentCommandsPort(
    c.repos.consents, 
    c.repos.delegations, 
    c.ids,
    c.consent.party,
    c.consent.validation,
    c.consent.audit,
    c.consent.events,
    c.idempotency.runner
  ),
  extractParams: (path, body) => ({
    envelopeId: path.envelopeId as EnvelopeId,
    consentId: path.consentId as ConsentId,
    idempotencyKey: body?.idempotencyKey,
    ttlSeconds: body?.ttlSeconds || 300,
  }),
  responseType: "ok",
  includeActor: true,
});
