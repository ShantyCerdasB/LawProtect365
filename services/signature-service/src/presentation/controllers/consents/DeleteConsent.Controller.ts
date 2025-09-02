/**
 * @file DeleteConsent.Controller.ts
 * @summary Controller for deleting a consent
 * @description Handles DELETE /envelopes/:envelopeId/consents/:consentId requests using command controller factory
 */

import { createCommandController } from "../../../shared/controllers/commandControllerFactory";
import { makeConsentCommandsPort } from "../../../app/adapters/consent/MakeConsentCommandsPort";
import { ConsentCommandService } from "../../../app/services/Consent/ConsentCommandService";
import type { DeleteConsentControllerInput } from "../../../shared/types/consent/ControllerInputs";
import { UpdateConsentPath } from "../../schemas/consents/UpdateConsent.schema";
import type { EnvelopeId, ConsentId } from "../../../domain/value-objects/Ids";

export const handler = createCommandController<DeleteConsentControllerInput, void>({
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
  responseType: "noContent",
  includeActor: true,
});
