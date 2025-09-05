/**
 * @file ListDocumentLocks.Controller.ts
 * @summary List Document Locks controller
 * @description Handles document locks listing
 */

import { createQueryController } from "../../../shared/controllers/queryFactory";
import { makeDocumentsQueriesPort } from "../../../app/adapters/documents/makeDocumentsQueriesPort";
import { DefaultDocumentsQueryService } from "../../../app/services/Documents";
import { DocumentIdPath } from "../../../presentation/schemas/common/path";
import type { DocumentLock } from "../../../domain/value-objects/DocumentLock";
import type { DocumentId } from "../../../domain/value-objects/Ids";
import { DocumentIdSchema } from "../../../domain/value-objects/Ids";

/**
 * @description List Document Locks controller
 */
export const ListDocumentLocksController = createQueryController<{ documentId: DocumentId }, DocumentLock[]>({
  pathSchema: DocumentIdPath,
  appServiceClass: DefaultDocumentsQueryService,
  createDependencies: (c) => makeDocumentsQueriesPort(c.repos.documents),
  extractParams: (path) => ({
    documentId: DocumentIdSchema.parse(path.id),
  }),
  responseType: "ok"
});

// Export handler for backward compatibility
export const handler = ListDocumentLocksController;
