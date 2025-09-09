/**
 * @file CreateDocument.Controller.ts
 * @summary Create Document controller
 * @description Handles document creation within envelopes
 */

import { createCommandController } from "../../../shared/controllers/controllerFactory";
import { makeDocumentsCommandsPort } from "../../../app/adapters/documents/makeDocumentsCommandsPort";
import { DefaultDocumentsCommandService } from "../../../app/services/Documents";
import { CreateDocumentBody } from "../../../presentation/schemas/documents/CreateDocument.schema";
import { EnvelopeIdPath } from "../../../presentation/schemas/common/path";
import type { CreateDocumentCommand, CreateDocumentResult } from "../../../app/ports/documents/DocumentsCommandsPort";
import { createDocumentDependencies, extractDocumentCreateParams } from "../../../shared/controllers/helpers";

/**
 * @description Create Document controller
 */
export const CreateDocumentController = createCommandController<CreateDocumentCommand, CreateDocumentResult>({
  bodySchema: CreateDocumentBody,
  pathSchema: EnvelopeIdPath,
  appServiceClass: DefaultDocumentsCommandService,
  createDependencies: (c: any) => makeDocumentsCommandsPort(createDocumentDependencies(c)),
  extractParams: extractDocumentCreateParams,
  responseType: "created",
  includeActor: true,
});

// Export handler for backward compatibility
export const handler = CreateDocumentController;








