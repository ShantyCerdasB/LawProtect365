/**
 * @file CompleteSigningWithToken.Controller.ts
 * @summary Complete Signing with Token controller
 * @description Handles unauthenticated signing completion using invitation tokens
 */

import { createController as createGenericController, mapError } from "@lawprotect/shared-ts";
import { getContainer } from "../../../core/Container";
import { SigningCommandService } from "../../../app/services/Signing";
import { CompleteSigningWithTokenSchema } from "../../schemas/signing/CompleteSigningWithToken.schema";
import type { CompleteSigningWithTokenControllerInput } from "../../../domain/types/signing/ControllerInputs";
import type { CompleteSigningWithTokenResult } from "../../../app/ports/signing/SigningCommandsPort";

/**
 * @summary Controller for completing signing with invitation tokens
 * @description Allows unauthenticated users to sign documents using invitation tokens
 * This controller does NOT require authentication as it's for unauthenticated users
 */
const baseController = createGenericController<CompleteSigningWithTokenControllerInput, CompleteSigningWithTokenResult>({
  pathSchema: CompleteSigningWithTokenSchema.path,
  bodySchema: CompleteSigningWithTokenSchema.body,
  getContainer,
  appServiceClass: SigningCommandService,
  createDependencies: (c: any) => c.signing.command, // Use the service from container
  extractParams: (path: any, body: any, context: any) => {
    return {
      envelopeId: path.id,
      signerId: body.signerId,
      finalPdfUrl: body.finalPdfUrl,
      token: body.token,
      digest: body.digest,
      algorithm: body.algorithm,
      keyId: body.keyId,
      ip: context.requestContext?.identity?.sourceIp,
      userAgent: context.requestContext?.identity?.userAgent
    };
  },
  responseType: "ok",
  methodName: "completeSigningWithToken"
});

// Wrap with error handling but NO authentication (unlike other controllers)
export const CompleteSigningWithTokenController = async (evt: any) => {
  try {
    return await baseController(evt);
  } catch (error: any) {
    return mapError(error);
  }
};
