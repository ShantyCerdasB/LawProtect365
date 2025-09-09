/**
 * @file DownloadSignedDocument.Controller.ts
 * @summary Download Signed Document controller
 * @description Handles signed document download requests
 */

import { createCommandController, createSigningDependenciesWithS3 } from "../../../shared/controllers/controllerFactory";
import { DefaultSigningCommandService } from "../../../app/services/Signing";
import { DownloadSignedDocumentBody } from "../../../presentation/schemas/signing/DownloadSignedDocument.schema";
import { EnvelopeIdPath } from "../../../presentation/schemas/common/path";
import type { DownloadSignedDocumentControllerInput } from "../../../domain/types/signing/ControllerInputs";
import type { DownloadSignedDocumentResult } from "../../../app/ports/signing/SigningCommandsPort";

/**
 * @description Download Signed Document controller
 */
export const DownloadSignedDocumentController = createCommandController<DownloadSignedDocumentControllerInput, DownloadSignedDocumentResult>({
  bodySchema: DownloadSignedDocumentBody,
  pathSchema: EnvelopeIdPath,
  appServiceClass: DefaultSigningCommandService,
  createDependencies: createSigningDependenciesWithS3,
  extractParams: (path: any, _body: any) => ({
    tenantId: path.tenantId,
    envelopeId: path.id,
    token: "", // Will be injected by factory
  }),
  responseType: "ok",
});

// Export handler for backward compatibility
export const handler = DownloadSignedDocumentController;








