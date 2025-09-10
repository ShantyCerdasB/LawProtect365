/**
 * @file UpdateConsent.Controller.ts
 * @summary Controller for updating a consent
 * @description Handles PATCH /envelopes/:envelopeId/consents/:consentId requests using command controller factory
 */

import { createCommandController, createConsentDependencies } from "../../../shared/controllers/controllerFactory";
import { makeConsentCommandsPort } from "../../../app/adapters/consent/MakeConsentCommandsPort";
import { ConsentCommandService } from "../../../app/services/Consent/ConsentCommandService";
import type { UpdateConsentControllerInput } from "../../../domain/types/consent/ControllerInputs";
import type { UpdateConsentAppResult } from "../../../domain/types/consent/AppServiceInputs";
import { UpdateConsentPath, UpdateConsentBody } from "../../schemas/consents/UpdateConsent.schema";
import type { EnvelopeId, ConsentId } from "@/domain/value-objects/ids";
import type { ConsentStatus } from "../../../domain/values/enums";

export const handler = createCommandController<UpdateConsentControllerInput, UpdateConsentAppResult>({
  pathSchema: UpdateConsentPath,
  bodySchema: UpdateConsentBody,
  appServiceClass: ConsentCommandService,
  createDependencies: (c: any) => makeConsentCommandsPort(createConsentDependencies(c)),
  extractParams: (path: any, body: any) => ({
    envelopeId: path.envelopeId as EnvelopeId,
    consentId: path.consentId as ConsentId,
    status: body.status as ConsentStatus,
    metadata: body.metadata,
    expiresAt: body.expiresAt,
    idempotencyKey: body.idempotencyKey,
    ttlSeconds: body.ttlSeconds || 300}),
  responseType: "ok",
  includeActor: true});

