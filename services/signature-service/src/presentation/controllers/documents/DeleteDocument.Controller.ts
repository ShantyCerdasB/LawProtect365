/**
 * @file DeleteDocument.Controller.ts
 * @summary Delete Document controller
 * @description Handles document deletion
 */

import { createCommandController } from "../../../shared/controllers/controllerFactory";
import { makeDocumentsCommandsPort } from "../../../app/adapters/documents/makeDocumentsCommandsPort";
import { DefaultDocumentsCommandService } from "../../../app/services/Documents";
import { DocumentIdPath } from "../../../presentation/schemas/common/path";
import type { DocumentId } from "../../../domain/value-objects/Ids";

/**
 * @description Delete Document controller
 */
export const DeleteDocumentController = createCommandController<{ documentId: DocumentId }, void>({
  pathSchema: DocumentIdPath,
  appServiceClass: DefaultDocumentsCommandService,
  createDependencies: (c) => makeDocumentsCommandsPort({
    documentsRepo: c.repos.documents,
    ids: c.ids,
    s3Service: c.services.documentsS3,
  }),
  extractParams: (path) => ({
    documentId: path.id,
  }),
  responseType: "noContent",
  includeActor: true,
});

// Export handler for backward compatibility
export const handler = DeleteDocumentController;
