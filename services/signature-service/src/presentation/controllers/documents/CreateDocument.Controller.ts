/**
 * @file CreateDocument.Controller.ts
 * @summary Controller for creating new documents within envelopes
 * @description Handles POST /envelopes/:envelopeId/documents endpoint using createCommandController pattern
 */

import { createCommandController } from "@/presentation/controllerFactory";
import { CreateDocumentBody } from "@/presentation/schemas/documents/CreateDocument.schema";
import { EnvelopeIdPath } from "@/presentation/schemas/common/path";
import type { CreateDocumentCommand } from "@/app/ports/documents/DocumentsCommandsPort";

export const CreateDocumentController = createCommandController({
  method: "POST",
  path: "/envelopes/:id/documents",
  
  bodySchema: CreateDocumentBody,
  pathSchema: EnvelopeIdPath,
  
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

  commandPort: "documentsCommands",
  commandMethod: "create",
  
  responseMapper: (result) => ({
    data: {
      id: result.documentId,
      createdAt: result.createdAt,
    },
  }),
});
