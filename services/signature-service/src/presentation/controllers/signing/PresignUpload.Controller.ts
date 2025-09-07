/**
 * @file PresignUpload.Controller.ts
 * @summary Presign Upload controller
 * @description Handles presigned upload URL requests
 */

import { createCommandController, createSigningDependenciesWithS3 } from "../../../shared/controllers/controllerFactory";
import { DefaultSigningCommandService } from "../../../app/services/Signing";
import { PresignUploadBody } from "../../../presentation/schemas/signing/PresignUpload.schema";
import { EnvelopeIdPath } from "../../../presentation/schemas/common/path";
import type { PresignUploadControllerInput } from "../../../shared/types/signing/ControllerInputs";
import type { PresignUploadResult } from "../../../app/ports/signing/SigningCommandsPort";

/**
 * @description Presign Upload controller
 */
export const PresignUploadController = createCommandController<PresignUploadControllerInput, PresignUploadResult>({
  bodySchema: PresignUploadBody,
  pathSchema: EnvelopeIdPath,
  appServiceClass: DefaultSigningCommandService,
  createDependencies: createSigningDependenciesWithS3,
  extractParams: (path, body) => ({
    tenantId: path.tenantId,
    envelopeId: path.id,
    filename: body.filename,
    contentType: body.contentType,
    token: "", // Will be injected by factory
  }),
  responseType: "ok",
});

// Export handler for backward compatibility
export const handler = PresignUploadController;
