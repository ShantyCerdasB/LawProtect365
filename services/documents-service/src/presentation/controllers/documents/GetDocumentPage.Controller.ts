/**
 * @file GetDocumentPage.Controller.ts
 * @summary Get Document Page controller
 * @description Handles document page preview retrieval
 */

import { createQueryController } from "../../../shared/controllers/queryFactory";
import { makeDocumentsQueriesPort } from "../../../app/adapters/documents/makeDocumentsQueriesPort";
import { DefaultDocumentsQueryService } from "../../../app/services/Documents";
import { z } from "@lawprotect/shared-ts";
import type { Document } from "../../../domain/entities/Document";
import type { DocumentId } from "@/domain/value-objects/ids";
import { DocumentIdSchema } from "@/domain/value-objects/ids";

/**
 * @description Path parameter schema for document page retrieval
 */
const EnvelopeDocPagePath = z.object({
  envelopeId: z.string().min(1),
  docId: z.string().min(1),
  pageNo: z.coerce.number().int().positive()});

/**
 * @description Query parameter schema for document page options
 */
const DocumentPageQuery = z.object({
  w: z.coerce.number().int().positive().optional(),
  h: z.coerce.number().int().positive().optional(),
  quality: z.coerce.number().int().min(1).max(100).optional()}).optional();

/**
 * @description Get Document Page controller
 */
export const GetDocumentPageController = createQueryController<{ documentId: DocumentId }, Document | null>({
  pathSchema: EnvelopeDocPagePath,
  querySchema: DocumentPageQuery,
  appServiceClass: DefaultDocumentsQueryService,
  createDependencies: (c: any) => makeDocumentsQueriesPort(c.repos.documents),
  extractParams: (path: any) => ({
    documentId: DocumentIdSchema.parse(path.docId)}),
  responseType: "ok"
});

// Export handler for backward compatibility
export const handler = GetDocumentPageController;

