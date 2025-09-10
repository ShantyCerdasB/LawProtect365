/**
 * @file ListDocumentLocks.Controller.ts
 * @summary List Document Locks controller
 * @description Handles document locks listing
 */

import { createQueryController } from "../../../shared/controllers/queryFactory";
import { makeDocumentsQueriesPort } from "../../../app/adapters/documents/makeDocumentsQueriesPort";
import { DefaultDocumentsQueryService } from "../../../app/services/Documents";
import { DocumentIdPath } from "../../../presentation/schemas/common/path";
import type { DocumentLock } from "@lawprotect/shared-ts";
import type { DocumentId } from "@/domain/value-objects/ids";
import { DocumentIdSchema } from "@/domain/value-objects/ids";

/**
 * @description List Document Locks controller
 */
export const ListDocumentLocksController = createQueryController<{ documentId: DocumentId }, DocumentLock[]>({
  pathSchema: DocumentIdPath,
  appServiceClass: DefaultDocumentsQueryService,
  createDependencies: (c: any) => makeDocumentsQueriesPort(c.repos.documents),
  extractParams: (path: any) => ({
    documentId: DocumentIdSchema.parse(path.id)}),
  responseType: "ok"
});

// Export handler for backward compatibility
export const handler = ListDocumentLocksController;

