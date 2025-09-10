/**
 * @file GetDocumentCertificate.Controller.ts
 * @summary Get Document Certificate controller
 * @description Handles document certificate retrieval
 */

import { createQueryController } from "../../../shared/controllers/queryFactory";
import { makeDocumentsQueriesPort } from "../../../app/adapters/documents/makeDocumentsQueriesPort";
import { DefaultDocumentsQueryService } from "../../../app/services/Documents";
import { DocumentIdPath } from "../../../presentation/schemas/common/path";
import type { Document } from "../../../domain/entities/Document";
import type { DocumentId } from "@/domain/value-objects/ids";
import { DocumentIdSchema } from "@/domain/value-objects/ids";

/**
 * @description Get Document Certificate controller
 */
export const GetDocumentCertificateController = createQueryController<{ documentId: DocumentId }, Document | null>({
  pathSchema: DocumentIdPath,
  appServiceClass: DefaultDocumentsQueryService,
  createDependencies: (c: any) => makeDocumentsQueriesPort(c.repos.documents),
  extractParams: (path: any) => ({
    documentId: DocumentIdSchema.parse(path.id)}),
  responseType: "ok"
});

// Export handler for backward compatibility
export const handler = GetDocumentCertificateController;

