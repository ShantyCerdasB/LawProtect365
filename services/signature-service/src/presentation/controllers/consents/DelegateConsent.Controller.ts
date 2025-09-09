/**
 * @file DelegateConsent.Controller.ts
 * @summary Controller for delegating a consent
 * @description Handles POST /envelopes/:envelopeId/consents/:consentId/delegate requests using command controller factory
 */

import { createCommandController } from "../../../shared/controllers/controllerFactory";
import { makeConsentCommandsPort } from "../../../app/adapters/consent/MakeConsentCommandsPort";
import { ConsentCommandService } from "../../../app/services/Consent/ConsentCommandService";
import type { DelegateConsentControllerInput } from "../../../domain/types/consent/ControllerInputs";
import type { DelegateConsentAppResult } from "../../../domain/types/consent/AppServiceInputs";
import { DelegateConsentPath, DelegateConsentBody } from "../../schemas/consents/DelegateConsent.schema";
import type { EnvelopeId, ConsentId } from "@/domain/value-objects/ids";

export const handler = createCommandController<DelegateConsentControllerInput, DelegateConsentAppResult>({
  pathSchema: DelegateConsentPath,
  bodySchema: DelegateConsentBody,
  appServiceClass: ConsentCommandService,
  createDependencies: (c: any) => makeConsentCommandsPort({
    consentsRepo: c.repos.consents,
    delegationsRepo: c.repos.delegations,
    ids: c.ids,
    globalPartiesRepo: c.consent.party,
    validationService: c.consent.validation,
    auditService: c.consent.audit,
    eventService: c.consent.events,
    idempotencyRunner: c.idempotency.runner
  }),
  extractParams: (path: any, body: any) => ({
    envelopeId: path.envelopeId as EnvelopeId,
    consentId: path.consentId as ConsentId,
    delegateEmail: body.delegateEmail,
    delegateName: body.delegateName,
    reason: body.reason,
    expiresAt: body.expiresAt,
    metadata: body.metadata,
    idempotencyKey: body.idempotencyKey,
    ttlSeconds: body.ttlSeconds || 300,
  }),
  responseType: "ok",
  includeActor: true,
});








