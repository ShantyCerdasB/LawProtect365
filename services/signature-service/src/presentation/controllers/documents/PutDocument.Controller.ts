/**
 * @file PutDocument.Controller.ts
 * @summary Put Document controller
 * @description Handles document binary updates
 */

import { createCommandController } from "../../../shared/controllers/controllerFactory";
import { makeDocumentsCommandsPort } from "../../../app/adapters/documents/makeDocumentsCommandsPort";
import { DefaultDocumentsCommandService } from "../../../app/services/Documents";
import { DocumentIdPath } from "../../../presentation/schemas/common/path";
import { z } from "@lawprotect/shared-ts";
import { ALLOWED_CONTENT_TYPES } from "../../../domain/values/enums";
import type { UpdateDocumentBinaryCommand, UpdateDocumentResult } from "../../../app/ports/documents/DocumentsCommandsPort";

/**
 * @description Body payload schema for updating document binary
 */
const PutDocumentBody = z.object({
  contentType: z.enum(ALLOWED_CONTENT_TYPES),
  size: z.number().int().positive(),
  digest: z.string().min(1),
  bucket: z.string().min(1),
  key: z.string().min(1),
  pageCount: z.number().int().positive().optional(),
});

/**
 * @description Put Document controller
 */
export const PutDocumentController = createCommandController<UpdateDocumentBinaryCommand, UpdateDocumentResult>({
  bodySchema: PutDocumentBody,
  pathSchema: DocumentIdPath,
  appServiceClass: DefaultDocumentsCommandService,
  createDependencies: (c) => makeDocumentsCommandsPort({
    documentsRepo: c.repos.documents,
    ids: c.ids,
    s3Service: c.services.documentsS3,
  }),
  extractParams: (path, body) => ({
    documentId: path.id,
    contentType: body.contentType,
    size: body.size,
    digest: body.digest,
    s3Ref: { bucket: body.bucket, key: body.key },
    pageCount: body.pageCount,
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
export const handler = PutDocumentController;
