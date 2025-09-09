/**
 * @file DeleteDocument.Controller.ts
 * @summary Delete Document controller
 * @description Handles document deletion
 */

import { createCommandController } from "../../../shared/controllers/controllerFactory";
import { makeDocumentsCommandsPort } from "../../../app/adapters/documents/makeDocumentsCommandsPort";
import { DefaultDocumentsCommandService } from "../../../app/services/Documents";
import { DocumentIdPath } from "../../../presentation/schemas/common/path";
import type { DocumentId } from "@/domain/value-objects/ids";

/**
 * @description Delete Document controller
 */
export const DeleteDocumentController = createCommandController<{ documentId: DocumentId }, void>({
  pathSchema: DocumentIdPath,
  appServiceClass: DefaultDocumentsCommandService,
  createDependencies: (c: any) => makeDocumentsCommandsPort({
    documentsRepo: c.repos.documents,
    envelopesRepo: c.repos.envelopes,
    ids: c.ids,
    s3Service: c.services.documentsS3,
    s3Config: {
      evidenceBucket: c.config.s3.evidenceBucket,
      signedBucket: c.config.s3.signedBucket,
    },
  }),
  extractParams: (path: any) => ({
    documentId: path.id,
  }),
  responseType: "noContent",
  includeActor: true,
});

// Export handler for backward compatibility
export const handler = DeleteDocumentController;








