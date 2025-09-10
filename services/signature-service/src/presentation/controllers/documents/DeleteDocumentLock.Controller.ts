/**
 * @file DeleteDocumentLock.Controller.ts
 * @summary Delete Document Lock controller
 * @description Handles document lock deletion
 */

import { createCommandController } from "../../../shared/controllers/controllerFactory";
import { makeDocumentsCommandsPort } from "../../../app/adapters/documents/makeDocumentsCommandsPort";
import { DefaultDocumentsCommandService } from "../../../app/services/Documents";
import { z } from "@lawprotect/shared-ts";
import type { DocumentId } from "@/domain/value-objects/ids";

/**
 * @description Path parameter schema for document lock deletion
 */
const DocumentLockPath = z.object({
  documentId: z.string().min(1),
  lockId: z.string().min(1),
});

/**
 * @description Delete Document Lock controller
 */
export const DeleteDocumentLockController = createCommandController<{ documentId: DocumentId; lockId: string }, void>({
  pathSchema: DocumentLockPath,
  appServiceClass: DefaultDocumentsCommandService,
  createDependencies: (c: any) => makeDocumentsCommandsPort({
    documentsRepo: c.repos.documents,
    envelopesRepo: c.repos.envelopes,
    ids: c.ids,
    s3Service: c.documents.s3Service,
    s3Config: {
      evidenceBucket: c.config.s3.evidenceBucket,
      signedBucket: c.config.s3.signedBucket,
    },
  }),
  extractParams: (path: any) => ({
    documentId: path.documentId,
    lockId: path.lockId,
  }),
  responseType: "noContent",
  includeActor: true,
});

// Export handler for backward compatibility
export const handler = DeleteDocumentLockController;








