/**
 * @file createEnvelopeDocument.ts
 * @description Controller for creating new documents within envelopes via POST /envelopes/:envelopeId/documents endpoint.
 * Validates input, derives tenant and actor from auth context, and delegates to the CreateDocument app service.
 */

import type { HandlerFn } from "@lawprotect/shared-ts";
import { created, validateRequest } from "@lawprotect/shared-ts";
import { wrapController, corsFromEnv } from "@/middleware/http";
import { tenantFromCtx, actorFromCtx } from "@/middleware/auth";
import { getContainer } from "@/infra/Container";
import { CreateDocumentBody } from "@/schemas/documents/CreateDocument.schema";
import { EnvelopeIdPath } from "@/schemas/common/path";
import { toTenantId, toEnvelopeId } from "@/app/ports/shared";
import { createDocumentApp } from "@/app/services/Documents/CreateDocumentApp.service";
import { makeDocumentsCommandsPort } from "@/app/adapters/documents/makeDocumentsCommandsPort";

/**
 * @description Base handler function for creating a new document within an envelope.
 * Validates request body and path parameters, extracts tenant and actor information, and delegates to the app service.
 *
 * @param {any} evt - The Lambda event containing HTTP request data
 * @returns {Promise<any>} Promise resolving to HTTP response with created document data or error
 * @throws {AppError} When validation fails or document creation fails
 */
const base: HandlerFn = async (evt) => {
  const { body, path } = validateRequest(evt, { 
    body: CreateDocumentBody,
    path: EnvelopeIdPath 
  });

  const tenantId = toTenantId(tenantFromCtx(evt));
  const envelopeId = toEnvelopeId(path.id);
  const actor = actorFromCtx(evt);

  const c = getContainer();
  const documentsCommands = makeDocumentsCommandsPort(c.repos.documents, c.repos.envelopes, { ids: c.ids });

  const result = await createDocumentApp(
    { 
      tenantId, 
      envelopeId, 
      name: body.name,
      contentType: body.contentType,
      size: body.size,
      digest: body.digest,
      s3Ref: { bucket: body.bucket, key: body.key },
      pageCount: body.pageCount,
      actor 
    },
    { documentsCommands }
  );

  return created({ data: { id: result.documentId, createdAt: result.createdAt } });
};

/**
 * @description Lambda handler for POST /envelopes/:envelopeId/documents endpoint.
 * Wraps the base handler with authentication, observability, and CORS middleware.
 *
 * @param {any} evt - The Lambda event containing HTTP request data
 * @returns {Promise<any>} Promise resolving to HTTP response with created document data
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
