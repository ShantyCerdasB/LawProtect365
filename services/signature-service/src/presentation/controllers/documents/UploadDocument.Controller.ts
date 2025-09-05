/**
 * @file UploadDocument.Controller.ts
 * @summary Controller for uploading new documents (original document upload)
 * @description Handles POST /envelopes/:envelopeId/documents/upload endpoint using createCommandController pattern
 */

import { createCommandController } from "@/presentation/controllerFactory";
import { UploadDocumentBody } from "@/presentation/schemas/documents/UploadDocument.schema";
import { EnvelopeIdPath } from "@/presentation/schemas/common/path";
import type { UploadDocumentCommand } from "@/app/ports/documents/DocumentsCommandsPort";

export const UploadDocumentController = createCommandController({
  method: "POST",
  path: "/envelopes/:id/documents/upload",
  
  bodySchema: UploadDocumentBody,
  pathSchema: EnvelopeIdPath,
  
  extractParams: (path, body) => ({
    tenantId: path.tenantId,
    envelopeId: path.id,
    name: body.name,
    contentType: body.contentType,
    size: body.size,
    digest: body.digest,
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
  commandMethod: "upload",
  
  responseMapper: (result) => ({
    data: {
      id: result.documentId,
      uploadedAt: result.uploadedAt,
      uploadUrl: result.uploadUrl,
      objectKey: result.objectKey,
      expiresAt: result.expiresAt,
    },
  }),
});
