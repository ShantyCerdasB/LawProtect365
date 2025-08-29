/**
 * @file createDocumentLock.ts
 * @description Controller for creating document locks via POST /documents/:documentId/locks endpoint.
 * Validates input, derives tenant and actor from auth context, and delegates to the CreateDocumentLock app service.
 */

import type { HandlerFn } from "@lawprotect/shared-ts";
import { created, validateRequest, z } from "@lawprotect/shared-ts";
import { wrapController, corsFromEnv } from "@/middleware/http";
import {actorFromCtx } from "@/middleware/auth";
import { getContainer } from "@/infra/Container";
import { DocumentIdPath } from "@/schemas/common/path";
import { toDocumentId, toUserId } from "@/app/ports/shared";
import { createDocumentLockApp } from "@/app/services/Documents/CreateDocumentLockApp.service";
import { makeDocumentsCommandsPort } from "@/app/adapters/documents/makeDocumentsCommandsPort";

/**
 * @description Body payload schema for creating a document lock.
 */
const CreateDocumentLockBody = z.object({
  ttlSeconds: z.number().int().positive().optional(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * @description Base handler function for creating a document lock.
 * Validates request body and path parameters, extracts tenant and actor information, and delegates to the app service.
 *
 * @param {any} evt - The Lambda event containing HTTP request data
 * @returns {Promise<any>} Promise resolving to HTTP response with created lock data or error
 * @throws {AppError} When validation fails or lock creation fails
 */
const base: HandlerFn = async (evt) => {
  const { body, path } = validateRequest(evt, { 
    body: CreateDocumentLockBody,
    path: DocumentIdPath 
  });

  const documentId = toDocumentId(path.id);
  const actor = actorFromCtx(evt);
  const ownerId = toUserId(actor.userId || "");

  const c = getContainer();
  const documentsCommands = makeDocumentsCommandsPort(c.repos.documents, c.repos.envelopes, { ids: c.ids });

  const result = await createDocumentLockApp(
    { 
      documentId,
      ownerId,
      ownerEmail: actor.email,
      ownerIp: actor.ip,
      ownerUserAgent: actor.userAgent,
      ttlSeconds: body.ttlSeconds,
      metadata: body.metadata
    },
    { documentsCommands }
  );

  return created({ data: { lockId: result.lockId, expiresAt: result.expiresAt } });
};

/**
 * @description Lambda handler for POST /documents/:documentId/locks endpoint.
 * Wraps the base handler with authentication, observability, and CORS middleware.
 *
 * @param {any} evt - The Lambda event containing HTTP request data
 * @returns {Promise<any>} Promise resolving to HTTP response with created lock data
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
