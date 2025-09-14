/**
 * @file RecordConsentWithToken.Controller.ts
 * @summary Record Consent with Token controller
 * @description Handles signing consent recording for unauthenticated users using invitation tokens
 */

import { createController as createGenericController, mapError } from "@lawprotect/shared-ts";
import { getContainer } from "../../../core/Container";
import { SigningCommandService } from "../../../app/services/Signing";
import { SigningConsentWithTokenSchema } from "../../schemas/signing/SigningConsentWithToken.schema";
import type { SigningConsentWithTokenControllerInput } from "../../../domain/types/signing/ControllerInputs";
import type { SigningConsentResult } from "../../../app/ports/signing/SigningCommandsPort";

/**
 * @summary Controller for recording consent with invitation tokens
 * @description Allows unauthenticated users to record consent using invitation tokens
 * This controller does NOT require authentication as it's for unauthenticated users
 */
const baseController = createGenericController<SigningConsentWithTokenControllerInput, SigningConsentResult>({
  pathSchema: SigningConsentWithTokenSchema.path,
  bodySchema: SigningConsentWithTokenSchema.body,
  getContainer,
  appServiceClass: SigningCommandService,
  createDependencies: (c: any) => c.signing.command,
  extractParams: (path: any, body: any, context: any) => ({
    envelopeId: path.id,
    signerId: body.signerId,
    token: body.token,
    consentGiven: body.consentGiven,
    consentText: body.consentText,
    ip: context.identity?.sourceIp,
    userAgent: context.identity?.userAgent
  }),
  responseType: "ok",
  methodName: "recordSigningConsentWithToken"
});

// Wrap with error handling but NO authentication (unlike other controllers)
export const RecordConsentWithTokenController = async (evt: any) => {
  try {
    return await baseController(evt);
  } catch (error: any) {
    return mapError(error);
  }
};

// Export handler for backward compatibility
export const handler = RecordConsentWithTokenController;
