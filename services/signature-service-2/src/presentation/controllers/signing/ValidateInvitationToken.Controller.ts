/**
 * @file ValidateInvitationToken.Controller.ts
 * @summary Controller for validating invitation tokens
 * @description Handles validation of invitation tokens for unauthenticated signing
 */

import { createController as createGenericController, mapError } from "@lawprotect/shared-ts";
import { getContainer } from "../../../core/Container";
import { SigningCommandService } from "../../../app/services/Signing";
import { ValidateInvitationTokenSchema } from "../../schemas/signing/ValidateInvitationToken.schema";
import type { ValidateInvitationTokenControllerInput } from "../../../domain/types/signing/ControllerInputs";
import type { ValidateInvitationTokenResult } from "../../../app/ports/signing/SigningCommandsPort";

/**
 * @summary Controller for validating invitation tokens
 * @description Validates invitation tokens and returns party information for signing
 * This controller does NOT require authentication as it's for unauthenticated users
 */
const baseController = createGenericController<ValidateInvitationTokenControllerInput, ValidateInvitationTokenResult>({
  pathSchema: ValidateInvitationTokenSchema.path,
  getContainer,
  appServiceClass: SigningCommandService,
  createDependencies: (c: any) => c.signing.command, // Use the service from container
  extractParams: (path: any, _body: any, context: any) => ({
    token: path.token,
    ip: context.identity?.sourceIp,
    userAgent: context.identity?.userAgent
  }),
  responseType: "ok",
  methodName: "validateInvitationToken"
});

// Wrap with error handling but NO authentication (unlike other controllers)
export const ValidateInvitationTokenController = async (evt: any) => {
  try {
    return await baseController(evt);
  } catch (error: any) {
    return mapError(error);
  }
};
