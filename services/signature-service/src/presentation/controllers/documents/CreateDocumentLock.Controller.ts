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
import type { DocumentLock } from "@lawprotect/shared-ts";
import { randomBytes } from "crypto";

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
  extractParams: (path: any, body: any) => ({
    documentId: path.id,
    lock: {
      lockId: `lock-${Date.now()}-${randomBytes(8).toString('hex')}`,
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








