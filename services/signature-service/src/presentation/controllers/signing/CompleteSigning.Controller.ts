/**
 * @file CompleteSigning.Controller.ts
 * @summary Complete Signing controller
 * @description Handles signing completion requests
 */

import { createCommandController, createSigningDependenciesWithS3 } from "../../../shared/controllers/controllerFactory";
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
  createDependencies: createSigningDependenciesWithS3,
  extractParams: (path: any, body: any) => ({
    tenantId: path.tenantId,
    envelopeId: path.id,
    signerId: body.signerId,
    digest: body.digest,
    algorithm: body.algorithm,
    keyId: body.keyId,
    otpCode: body.otpCode,
    token: "", // Will be injected by factory
  }),
  responseType: "ok",
});

// Export handler for backward compatibility
export const handler = CompleteSigningController;








