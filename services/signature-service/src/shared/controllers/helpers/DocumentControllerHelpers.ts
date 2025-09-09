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
    s3Config: {
      evidenceBucket: c.config.s3.evidenceBucket,
      signedBucket: c.config.s3.signedBucket,
    },
  };
}

/**
 * Common parameter extraction for document controllers with envelope path
 */
export function extractDocumentParams(path: Record<string, unknown>, body: Record<string, unknown>) {
  return {
    tenantId: path.tenantId,
    envelopeId: path.id,
    name: body.name,
    contentType: body.contentType,
    size: body.size,
    digest: body.digest,
    pageCount: body.pageCount,
    actor: {
      userId: (path.actor as any)?.userId,
      email: (path.actor as any)?.email,
      ip: (path.actor as any)?.ip,
      userAgent: (path.actor as any)?.userAgent,
      role: (path.actor as any)?.role,
    },
  };
}

/**
 * Common parameter extraction for document upload controllers
 */
export function extractDocumentUploadParams(path: Record<string, unknown>, body: Record<string, unknown>) {
  return {
    ...extractDocumentParams(path, body),
    ipAddress: body.ipAddress,
  };
}

/**
 * Common parameter extraction for document creation controllers
 */
export function extractDocumentCreateParams(path: Record<string, unknown>, body: Record<string, unknown>) {
  return {
    ...extractDocumentParams(path, body),
    s3Ref: { bucket: body.bucket, key: body.key },
  };
}
