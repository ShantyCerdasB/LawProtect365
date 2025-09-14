/**
 * @file CompleteSigning.Controller.ts
 * @summary Complete Signing controller
 * @description Handles signing completion requests
 */

import { createCommandController } from "../../../shared/controllers/controllerFactory";
import { SigningCommandService } from "../../../app/services/Signing";
import { CompleteSigningBody } from "../../../presentation/schemas/signing/CompleteSigning.schema";
import { EnvelopeIdPath } from "../../../presentation/schemas/common/path";
import type { CompleteSigningControllerInput } from "../../../domain/types/signing/ControllerInputs";
import type { CompleteSigningResult } from "../../../app/ports/signing/SigningCommandsPort";

/**
 * @description Complete Signing controller
 */
export const CompleteSigningController = createCommandController<CompleteSigningControllerInput, CompleteSigningResult>({
  bodySchema: CompleteSigningBody,
  pathSchema: EnvelopeIdPath,
  appServiceClass: SigningCommandService,
  createDependencies: (c: any) => c.signing.command, // Use the service from container
  extractParams: (path: any, body: any, context: any) => {
    console.log('🔍 [AUTH CONTROLLER DEBUG] CompleteSigning context:', JSON.stringify(context, null, 2));
    console.log('🔍 [AUTH CONTROLLER DEBUG] CompleteSigning path:', JSON.stringify(path, null, 2));
    console.log('🔍 [AUTH CONTROLLER DEBUG] CompleteSigning body:', JSON.stringify(body, null, 2));
    
    const params = {
      envelopeId: path.id,
      signerId: body.signerId,
      finalPdfUrl: body.finalPdfUrl,
      digest: body.digest,
      algorithm: body.algorithm,
      keyId: body.keyId,
      token: context?.actor?.email || "authenticated-user"
    };
    
    console.log('🔍 [AUTH CONTROLLER DEBUG] CompleteSigning params:', JSON.stringify(params, null, 2));
    
    return params;
  },
  responseType: "ok",
  includeActor: true, // Enable auth validation
  methodName: "completeSigning"});

// Export handler for backward compatibility
export const handler = CompleteSigningController;

