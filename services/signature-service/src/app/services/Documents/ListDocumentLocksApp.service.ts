/**
 * @file ListDocumentLocksApp.service.ts
 * @summary Application service for listing document locks
 * @description Orchestrates document locks listing operations, delegates to DocumentsQueriesPort,
 * and handles validation logic. Uses branded types for type safety.
 */

import type { DocumentId } from "@/app/ports/shared";
import type { DocumentsQueriesPort } from "@/app/ports/documents/DocumentsQueriesPort";
import type { DocumentLock } from "@/domain/value-objects/DocumentLock";
import { fromIso, nowIso } from "@lawprotect/shared-ts";
import { documentNotFound } from "@/errors";

/**
 * Input parameters for listing document locks
 */
export interface ListDocumentLocksAppInput {
  documentId: DocumentId;
}

/**
 * Output result for document locks listing
 */
export interface ListDocumentLocksAppResult {
  locks: DocumentLock[];
}

/**
 * Dependencies required by the ListDocumentLocks app service
 */
export interface ListDocumentLocksAppDependencies {
  documentsQueries: DocumentsQueriesPort;
}

/**
 * Lists document locks with proper validation
 * @param input - The input parameters containing document ID
 * @param deps - The dependencies containing the documents queries port
 * @returns Promise resolving to document locks list
 * @throws {AppError} When validation fails
 */
export const listDocumentLocksApp = async (
  input: ListDocumentLocksAppInput,
  deps: ListDocumentLocksAppDependencies
): Promise<ListDocumentLocksAppResult> => {
  // Validate that the document exists
  const document = await deps.documentsQueries.getById(input.documentId);
  if (!document) {
    throw documentNotFound({ documentId: input.documentId });
  }

  // Get all locks for the document
  const locks = await deps.documentsQueries.listLocks(input.documentId);

  // Filter out expired locks
  const now = fromIso(nowIso())!;
  const activeLocks = locks.filter(lock => {
    const lockExpiry = fromIso(lock.expiresAt);
    return lockExpiry && lockExpiry > now;
  });

  return { locks: activeLocks };
};
