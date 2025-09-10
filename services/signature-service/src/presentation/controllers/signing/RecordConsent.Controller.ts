/**
 * @file RecordConsent.Controller.ts
 * @summary Record Consent controller
 * @description Handles signing consent recording requests
 */

import { createCommandController } from "../../../shared/controllers/controllerFactory";
import { SigningCommandService } from "../../../app/services/Signing";
import { SigningConsentBody } from "../../../presentation/schemas/signing/SigningConsent.schema";
import { EnvelopeIdPath } from "../../../presentation/schemas/common/path";
import type { SigningConsentControllerInput } from "../../../domain/types/signing/ControllerInputs";
import type { SigningConsentResult } from "../../../app/ports/signing/SigningCommandsPort";

/**
 * @description Record Consent controller
 */
export const RecordConsentController = createCommandController<SigningConsentControllerInput, SigningConsentResult>({
  bodySchema: SigningConsentBody,
  pathSchema: EnvelopeIdPath,
  appServiceClass: SigningCommandService,
  createDependencies: (c: any) => c.signing.command, // Use the service from container
  extractParams: (path: any, body: any, context: any) => ({
    envelopeId: path.id,
    signerId: body.signerId,
    consentGiven: body.consentGiven,
    consentText: body.consentText,
    token: "", // Will be injected by factory
    actorEmail: context?.actor?.email // Add auth context
  }),
  responseType: "ok",
  includeActor: true, // Enable auth validation
  methodName: "recordSigningConsent"});

// Export handler for backward compatibility
export const handler = RecordConsentController;

