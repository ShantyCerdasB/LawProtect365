/**
 * @file GetDocumentPageApp.service.ts
 * @summary Application service for getting document page previews
 * @description Orchestrates document page preview operations, delegates to DocumentsQueriesPort,
 * and handles validation logic. Uses branded types for type safety.
 */

import type { DocumentId, EnvelopeId } from "@/app/ports/shared";
import type { DocumentsQueriesPort } from "@/app/ports/documents/DocumentsQueriesPort";

/**
 * Input parameters for getting document page preview
 */
export interface GetDocumentPageAppInput {
  envelopeId: EnvelopeId;
  documentId: DocumentId;
  pageNo: number;
  width?: number;
  height?: number;
  quality?: number;
}

/**
 * Output result for document page preview
 */
export interface GetDocumentPageAppResult {
  page: {
    pageNo: number;
    width: number;
    height: number;
    contentType: string;
  };
  imageUrl: string;
}

/**
 * Dependencies required by the GetDocumentPage app service
 */
export interface GetDocumentPageAppDependencies {
  documentsQueries: DocumentsQueriesPort;
}

/**
 * Gets document page preview with proper validation
 * @param input - The input parameters containing document page request data
 * @param deps - The dependencies containing the documents queries port
 * @returns Promise resolving to document page preview data
 * @throws {AppError} When validation fails or page retrieval fails
 */
export const getDocumentPageApp = async (
  input: GetDocumentPageAppInput,
  deps: GetDocumentPageAppDependencies
): Promise<GetDocumentPageAppResult> => {
  // Get the document to validate it exists and belongs to the envelope
  const document = await deps.documentsQueries.getById(input.documentId);
  if (!document) {
    throw new Error(`Document not found: ${input.documentId}`);
  }

  // Validate that the document belongs to the specified envelope
  if (document.envelopeId !== input.envelopeId) {
    throw new Error(`Document ${input.documentId} does not belong to envelope ${input.envelopeId}`);
  }

  // Validate page number
  if (document.pageCount && input.pageNo > document.pageCount) {
    throw new Error(`Page ${input.pageNo} does not exist. Document has ${document.pageCount} pages.`);
  }

  // Default dimensions if not provided
  const width = input.width || 800;
  const height = input.height || 600;
  const quality = input.quality || 85;

  // Generate S3 presigned URL for the page preview
  // In a real implementation, this would use S3 presign or a CDN service
  const imageUrl = `https://example-cdn.com/previews/${input.documentId}/page-${input.pageNo}?w=${width}&h=${height}&q=${quality}`;

  return {
    page: {
      pageNo: input.pageNo,
      width,
      height,
      contentType: "image/jpeg",
    },
    imageUrl,
  };
};
