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
import type { DocumentId } from "../../../domain/value-objects/Ids";
import { DocumentIdSchema } from "../../../domain/value-objects/Ids";

/**
 * @description Get Document Certificate controller
 */
export const GetDocumentCertificateController = createQueryController<{ documentId: DocumentId }, Document | null>({
  pathSchema: DocumentIdPath,
  appServiceClass: DefaultDocumentsQueryService,
  createDependencies: (c) => makeDocumentsQueriesPort(c.repos.documents),
  extractParams: (path) => ({
    documentId: DocumentIdSchema.parse(path.id),
  }),
  responseType: "ok"
});

// Export handler for backward compatibility
export const handler = GetDocumentCertificateController;
