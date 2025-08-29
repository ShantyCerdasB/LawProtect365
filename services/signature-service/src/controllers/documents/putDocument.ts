/**
 * @file putDocument.ts
 * @description Controller for updating document binary via PUT /documents/:documentId endpoint.
 * Validates input, derives tenant and actor from auth context, and delegates to the PutDocument app service.
 */

import type { HandlerFn } from "@lawprotect/shared-ts";
import { ok, validateRequest, z } from "@lawprotect/shared-ts";
import { wrapController, corsFromEnv } from "@/middleware/http";
import {  actorFromCtx } from "@/middleware/auth";
import { getContainer } from "@/infra/Container";
import { DocumentIdPath } from "@/schemas/common/path";
import { toDocumentId } from "@/app/ports/shared";
import { putDocumentApp } from "@/app/services/Documents/PutDocumentApp.service";
import { makeDocumentsCommandsPort } from "@/app/adapters/documents/makeDocumentsCommandsPort";
import { ALLOWED_CONTENT_TYPES } from "@/domain/values/enums";

/**
 * @description Body payload schema for updating document binary.
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
 * @description Base handler function for updating document binary.
 * Validates request body and path parameters, extracts tenant and actor information, and delegates to the app service.
 *
 * @param {any} evt - The Lambda event containing HTTP request data
 * @returns {Promise<any>} Promise resolving to HTTP response with updated document data or error
 * @throws {AppError} When validation fails or document update fails
 */
const base: HandlerFn = async (evt) => {
  const { body, path } = validateRequest(evt, { 
    body: PutDocumentBody,
    path: DocumentIdPath 
  });

  const documentId = toDocumentId(path.id);
  const actor = actorFromCtx(evt);

  const c = getContainer();
  const documentsCommands = makeDocumentsCommandsPort(c.repos.documents, c.repos.envelopes, { ids: c.ids });

  const result = await putDocumentApp(
    { 
      documentId,
      contentType: body.contentType,
      size: body.size,
      digest: body.digest,
      s3Ref: { bucket: body.bucket, key: body.key },
      pageCount: body.pageCount,
      actor
    },
    { documentsCommands }
  );

  return ok({ data: { id: result.documentId, updatedAt: result.updatedAt } });
};

/**
 * @description Lambda handler for PUT /documents/:documentId endpoint.
 * Wraps the base handler with authentication, observability, and CORS middleware.
 *
 * @param {any} evt - The Lambda event containing HTTP request data
 * @returns {Promise<any>} Promise resolving to HTTP response with updated document data
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
