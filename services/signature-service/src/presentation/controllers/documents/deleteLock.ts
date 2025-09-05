/**
 * @file deleteLock.ts
 * @description Controller for deleting document locks via DELETE /documents/:documentId/locks/:lockId endpoint.
 * Validates input, derives tenant and actor from auth context, and delegates to the DeleteDocumentLock app service.
 */

import type { HandlerFn } from "@lawprotect/shared-ts";
import { noContent, validateRequest, z } from "@lawprotect/shared-ts";
import { wrapController, corsFromEnv } from "@/presentation/middleware/http";
import {  actorFromCtx } from "@/presentation/middleware/auth";
import { getContainer } from "@/core/Container";
import { toDocumentId, toUserId } from "@/app/ports/shared";
import { deleteDocumentLockApp } from "@/app/services/Documents/DeleteDocumentLockApp.service";
import { makeDocumentsCommandsPort } from "@/app/adapters/documents/makeDocumentsCommandsPort";

/**
 * @description Path parameter schema for document lock deletion.
 */
const DocumentLockPath = z.object({
  documentId: z.string().min(1),
  lockId: z.string().min(1),
});

/**
 * @description Base handler function for deleting a document lock.
 * Validates path parameters, extracts tenant and actor information, and delegates to the app service.
 *
 * @param {any} evt - The Lambda event containing HTTP request data
 * @returns {Promise<any>} Promise resolving to HTTP response or error
 * @throws {AppError} When validation fails or lock deletion fails
 */
const base: HandlerFn = async (evt) => {
  const { path } = validateRequest(evt, { path: DocumentLockPath });

  const documentId = toDocumentId(path.documentId);
  const lockId = path.lockId;
  const actor = actorFromCtx(evt);
  const ownerId = toUserId(actor.userId || "");

  const c = getContainer();
  const documentsCommands = makeDocumentsCommandsPort(c.repos.documents, c.repos.envelopes, { ids: c.ids });

  await deleteDocumentLockApp(
    { 
      documentId,
      lockId,
      ownerId,
      ownerEmail: actor.email,
      ownerIp: actor.ip,
      ownerUserAgent: actor.userAgent
    },
    { documentsCommands }
  );

  return noContent();
};

/**
 * @description Lambda handler for DELETE /documents/:documentId/locks/:lockId endpoint.
 * Wraps the base handler with authentication, observability, and CORS middleware.
 *
 * @param {any} evt - The Lambda event containing HTTP request data
 * @returns {Promise<any>} Promise resolving to HTTP response
 */
export const handler = wrapController(base, {
  auth: true,
  observability: {
    logger: () => console,
    metrics: () => ({} as any),
    tracer: () => ({} as any),
  },
  cors: corsFromEnv(),
});
