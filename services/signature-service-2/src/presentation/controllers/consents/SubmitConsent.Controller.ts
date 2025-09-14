/**
 * @file SubmitConsent.Controller.ts
 * @summary Controller for submitting a consent
 * @description Handles POST /envelopes/:envelopeId/consents/:consentId/submit requests using command controller factory
 */

import { createCommandController, createConsentDependencies } from "../../../shared/controllers/controllerFactory";
import { makeConsentCommandsPort } from "../../../app/adapters/consent/MakeConsentCommandsPort";
import { ConsentCommandService } from "../../../app/services/Consent/ConsentCommandService";
import type { SubmitConsentControllerInput } from "../../../domain/types/consent/ControllerInputs";
import type { SubmitConsentAppResult } from "../../../domain/types/consent/AppServiceInputs";
import { UpdateConsentPath } from "../../schemas/consents/UpdateConsent.schema";
import type { EnvelopeId, ConsentId } from "@/domain/value-objects/ids";

export const handler = createCommandController<SubmitConsentControllerInput, SubmitConsentAppResult>({
  pathSchema: UpdateConsentPath,
  appServiceClass: ConsentCommandService,
  createDependencies: (c: any) => makeConsentCommandsPort(createConsentDependencies(c)),
  extractParams: (path: any, body: any) => ({
    envelopeId: path.envelopeId as EnvelopeId,
    consentId: path.consentId as ConsentId,
    idempotencyKey: body?.idempotencyKey,
    ttlSeconds: body?.ttlSeconds || 300}),
  responseType: "ok",
  includeActor: true});

