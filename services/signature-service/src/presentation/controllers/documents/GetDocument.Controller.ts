/**
 * @file GetDocument.Controller.ts
 * @summary Get Document controller
 * @description Handles document retrieval by ID
 */

import { createQueryController } from "../../../shared/controllers/queryFactory";
import { makeDocumentsQueriesPort } from "../../../app/adapters/documents/makeDocumentsQueriesPort";
import { DefaultDocumentsQueryService } from "../../../app/services/Documents";
import { DocumentIdPath } from "../../../presentation/schemas/common/path";
import type { DocumentId } from "../../../domain/value-objects/Ids";
import type { Document } from "../../../domain/entities/Document";
import { toDocumentId } from "../../../domain/value-objects/Ids";

/**
 * @description Get Document controller
 */
export const GetDocumentController = createQueryController<DocumentId, Document | null>({
  pathSchema: DocumentIdPath,
  appServiceClass: DefaultDocumentsQueryService,
  createDependencies: (c) => makeDocumentsQueriesPort(c.repos.documents),
  extractParams: (path) => ({
    documentId: toDocumentId(path.id),
  }),
  responseType: "ok"
});

// Export handler for backward compatibility
export const handler = GetDocumentController;
