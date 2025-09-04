/**
 * @file DeleteConsent.Controller.ts
 * @summary Controller for deleting a consent
 * @description Handles DELETE /envelopes/:envelopeId/consents/:consentId requests using command controller factory
 */

import { createCommandController } from "../../../shared/controllers/controllerFactory";
import { makeConsentCommandsPort } from "../../../app/adapters/consent/MakeConsentCommandsPort";
import { ConsentCommandService } from "../../../app/services/Consent/ConsentCommandService";
import type { DeleteConsentControllerInput } from "../../../shared/types/consent/ControllerInputs";
import { UpdateConsentPath } from "../../schemas/consents/UpdateConsent.schema";
import type { EnvelopeId, ConsentId } from "../../../domain/value-objects/Ids";

export const handler = createCommandController<DeleteConsentControllerInput, void>({
  pathSchema: UpdateConsentPath,
  appServiceClass: ConsentCommandService,
  createDependencies: (c) => makeConsentCommandsPort({
    consentsRepo: c.repos.consents,
    delegationsRepo: c.repos.delegations,
    ids: c.ids,
    globalPartiesRepo: c.consent.party,
    validationService: c.consent.validation,
    auditService: c.consent.audit,
    eventService: c.consent.events,
    idempotencyRunner: c.idempotency.runner
  }),
  extractParams: (path, body) => ({
    envelopeId: path.envelopeId as EnvelopeId,
    consentId: path.consentId as ConsentId,
    idempotencyKey: body?.idempotencyKey,
    ttlSeconds: body?.ttlSeconds || 300,
  }),
  responseType: "noContent",
  includeActor: true,
});
