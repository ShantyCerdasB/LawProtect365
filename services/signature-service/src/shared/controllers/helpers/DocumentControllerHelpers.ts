/**
 * @file DocumentControllerHelpers.ts
 * @summary Helper functions for document controllers
 * @description Provides reusable patterns for document-related controllers
 */

/**
 * Common dependencies factory for document controllers
 */
export function createDocumentDependencies(c: any) {
  return {
    documentsRepo: c.repos.documents,
    envelopesRepo: c.repos.envelopes,
    ids: c.ids,
    s3Service: c.services.documentsS3,
  };
}

/**
 * Common parameter extraction for document controllers with envelope path
 */
export function extractDocumentParams(path: any, body: any) {
  return {
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
  };
}

/**
 * Common parameter extraction for document upload controllers
 */
export function extractDocumentUploadParams(path: any, body: any) {
  return {
    ...extractDocumentParams(path, body),
    ipAddress: body.ipAddress,
  };
}

/**
 * Common parameter extraction for document creation controllers
 */
export function extractDocumentCreateParams(path: any, body: any) {
  return {
    ...extractDocumentParams(path, body),
    s3Ref: { bucket: body.bucket, key: body.key },
  };
}
