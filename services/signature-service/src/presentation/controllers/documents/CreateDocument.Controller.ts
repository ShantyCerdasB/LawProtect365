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
import type { CreateDocumentCommand } from "../../../app/ports/documents/DocumentsCommandsPort";
import type { CreateDocumentResult } from "../../../app/ports/documents/DocumentsCommandsPort";

/**
 * @description Create Document controller
 */
export const CreateDocumentController = createCommandController<CreateDocumentCommand, CreateDocumentResult>({
  bodySchema: CreateDocumentBody,
  pathSchema: EnvelopeIdPath,
  appServiceClass: DefaultDocumentsCommandService,
  createDependencies: (c) => makeDocumentsCommandsPort({
    documentsRepo: c.repos.documents,
    ids: c.ids,
    s3Service: c.services.documentsS3,
  }),
  extractParams: (path, body) => ({
    tenantId: path.tenantId,
    envelopeId: path.id,
    name: body.name,
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
  responseType: "created",
  includeActor: true,
});

// Export handler for backward compatibility
export const handler = CreateDocumentController;
