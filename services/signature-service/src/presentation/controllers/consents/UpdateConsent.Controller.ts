/**
 * @file UpdateConsent.Controller.ts
 * @summary Controller for updating a consent
 * @description Handles PATCH /envelopes/:envelopeId/consents/:consentId requests using command controller factory
 */

import { createCommandController } from "../../../shared/controllers/controllerFactory";
import { makeConsentCommandsPort } from "../../../app/adapters/consent/MakeConsentCommandsPort";
import { ConsentCommandService } from "../../../app/services/Consent/ConsentCommandService";
import type { UpdateConsentControllerInput } from "../../../shared/types/consent/ControllerInputs";
import type { UpdateConsentAppResult } from "../../../shared/types/consent/AppServiceInputs";
import { UpdateConsentPath, UpdateConsentBody } from "../../schemas/consents/UpdateConsent.schema";
import type { EnvelopeId, ConsentId } from "../../../domain/value-objects/Ids";
import type { ConsentStatus } from "../../../domain/values/enums";

export const handler = createCommandController<UpdateConsentControllerInput, UpdateConsentAppResult>({
  pathSchema: UpdateConsentPath,
  bodySchema: UpdateConsentBody,
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
    status: body.status as ConsentStatus,
    metadata: body.metadata,
    expiresAt: body.expiresAt,
    idempotencyKey: body.idempotencyKey,
    ttlSeconds: body.ttlSeconds || 300,
  }),
  responseType: "ok",
  includeActor: true,
});
