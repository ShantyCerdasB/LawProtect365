/**
 * @file PatchDocument.Controller.ts
 * @summary Patch Document controller
 * @description Handles document partial updates
 */

import { createCommandController } from "../../../shared/controllers/controllerFactory";
import { makeDocumentsCommandsPort } from "../../../app/adapters/documents/makeDocumentsCommandsPort";
import { DefaultDocumentsCommandService } from "../../../app/services/Documents";
import { DocumentIdPath } from "../../../presentation/schemas/common/path";
import { z } from "@lawprotect/shared-ts";
import type { UpdateDocumentCommand, UpdateDocumentResult } from "../../../app/ports/documents/DocumentsCommandsPort";

/**
 * @description Body payload schema for patching a document
 */
const PatchDocumentBody = z.object({
  name: z.string().min(1).optional(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * @description Patch Document controller
 */
export const PatchDocumentController = createCommandController<UpdateDocumentCommand, UpdateDocumentResult>({
  bodySchema: PatchDocumentBody,
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
  extractParams: (path: any, body: any) => ({
    documentId: path.id,
    name: body.name,
    metadata: body.metadata,
    actor: {
      userId: path.actor?.userId,
      email: path.actor?.email,
      ip: path.actor?.ip,
      userAgent: path.actor?.userAgent,
      role: path.actor?.role,
    },
  }),
  responseType: "ok",
  includeActor: true,
});

// Export handler for backward compatibility
export const handler = PatchDocumentController;








