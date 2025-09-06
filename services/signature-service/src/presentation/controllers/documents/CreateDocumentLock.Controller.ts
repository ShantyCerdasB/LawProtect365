/**
 * @file CreateDocumentLock.Controller.ts
 * @summary Create Document Lock controller
 * @description Handles document lock creation
 */

import { createCommandController } from "../../../shared/controllers/controllerFactory";
import { makeDocumentsCommandsPort } from "../../../app/adapters/documents/makeDocumentsCommandsPort";
import { DefaultDocumentsCommandService } from "../../../app/services/Documents";
import { DocumentIdPath } from "../../../presentation/schemas/common/path";
import { z } from "@lawprotect/shared-ts";
import type { DocumentLock } from "../../../domain/value-objects/DocumentLock";

/**
 * @description Body payload schema for creating a document lock
 */
const CreateDocumentLockBody = z.object({
  ttlSeconds: z.number().int().positive().optional(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * @description Create Document Lock controller
 */
export const CreateDocumentLockController = createCommandController<{ documentId: string; lock: DocumentLock }, void>({
  bodySchema: CreateDocumentLockBody,
  pathSchema: DocumentIdPath,
  appServiceClass: DefaultDocumentsCommandService,
  createDependencies: (c) => makeDocumentsCommandsPort({
    documentsRepo: c.repos.documents,
    ids: c.ids,
    s3Service: c.services.documentsS3,
  }),
  extractParams: (path, body) => ({
    documentId: path.id,
    lock: {
      lockId: `lock-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      documentId: path.id,
      ownerId: path.actor?.userId || "",
      ownerEmail: path.actor?.email || "",
      expiresAt: new Date(Date.now() + (body.ttlSeconds || 3600) * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      metadata: body.metadata,
    },
  }),
  responseType: "created",
  includeActor: true,
});

// Export handler for backward compatibility
export const handler = CreateDocumentLockController;
