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

/**
 * @description Upload Document controller
 */
export const UploadDocumentController = createCommandController<UploadDocumentCommand, UploadDocumentResult>({
  bodySchema: UploadDocumentBody,
  pathSchema: EnvelopeIdPath,
  appServiceClass: DefaultDocumentsCommandService,
  createDependencies: (c: any) => makeDocumentsCommandsPort({
    documentsRepo: c.repos.documents,
    envelopesRepo: c.repos.envelopes,
    ids: c.ids,
    s3Service: c.services.documentsS3,
  }),
  extractParams: (path: any, body: any) => ({
    tenantId: path.tenantId,
    envelopeId: path.id,
    name: body.name,
    contentType: body.contentType,
    size: body.size,
    digest: body.digest,
    pageCount: body.pageCount,
    ipAddress: body.ipAddress,
    actor: {
      userId: path.actor?.userId,
      email: path.actor?.email,
      ip: path.actor?.ip,
      userAgent: path.actor?.userAgent,
      role: path.actor?.role,
    },
  }),
  responseType: "created",
  includeActor: true,
});

// Export handler for backward compatibility
export const handler = UploadDocumentController;








