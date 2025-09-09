/**
 * @file UploadDocument.Controller.ts
 * @summary Upload Document controller
 * @description Handles document upload with presigned URLs
 */

import { createCommandController } from "../../../shared/controllers/controllerFactory";
import { makeDocumentsCommandsPort } from "../../../app/adapters/documents/makeDocumentsCommandsPort";
import { DefaultDocumentsCommandService } from "../../../app/services/Documents";
import { UploadDocumentBody } from "../../../presentation/schemas/documents/UploadDocument.schema";
import { EnvelopeIdPath } from "../../../presentation/schemas/common/path";
import type { UploadDocumentCommand, UploadDocumentResult } from "../../../app/ports/documents/DocumentsCommandsPort";
import { createDocumentDependencies, extractDocumentUploadParams } from "../../../shared/controllers/helpers";

/**
 * @description Upload Document controller
 */
export const UploadDocumentController = createCommandController<UploadDocumentCommand, UploadDocumentResult>({
  bodySchema: UploadDocumentBody,
  pathSchema: EnvelopeIdPath,
  appServiceClass: DefaultDocumentsCommandService,
  createDependencies: (c: any) => makeDocumentsCommandsPort(createDocumentDependencies(c)),
  extractParams: extractDocumentUploadParams,
  responseType: "created",
  includeActor: true,
});

// Export handler for backward compatibility
export const handler = UploadDocumentController;








