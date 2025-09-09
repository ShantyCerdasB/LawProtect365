/**
 * @file DeleteConsent.Controller.ts
 * @summary Controller for deleting a consent
 * @description Handles DELETE /envelopes/:envelopeId/consents/:consentId requests using command controller factory
 */

import { createCommandController, createConsentDependencies } from "../../../shared/controllers/controllerFactory";
import { makeConsentCommandsPort } from "../../../app/adapters/consent/MakeConsentCommandsPort";
import { ConsentCommandService } from "../../../app/services/Consent/ConsentCommandService";
import type { DeleteConsentControllerInput } from "../../../domain/types/consent/ControllerInputs";
import { UpdateConsentPath } from "../../schemas/consents/UpdateConsent.schema";
import type { EnvelopeId, ConsentId } from "@/domain/value-objects/ids";

export const handler = createCommandController<DeleteConsentControllerInput, void>({
  pathSchema: UpdateConsentPath,
  appServiceClass: ConsentCommandService,
  createDependencies: (c: any) => makeConsentCommandsPort(createConsentDependencies(c)),
  extractParams: (path: any, body: any) => ({
    envelopeId: path.envelopeId as EnvelopeId,
    consentId: path.consentId as ConsentId,
    idempotencyKey: body?.idempotencyKey,
    ttlSeconds: body?.ttlSeconds || 300,
  }),
  responseType: "noContent",
  includeActor: true,
});








