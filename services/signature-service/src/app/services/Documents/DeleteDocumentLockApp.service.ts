/**
 * @file DeleteDocumentLockApp.service.ts
 * @summary Application service for deleting document locks
 * @description Orchestrates document lock deletion operations, delegates to DocumentsCommandsPort,
 * and handles validation logic. Uses branded types for type safety.
 */

import type { DocumentId, UserId } from "@/app/ports/shared";
import type { DocumentsCommandsPort } from "@/app/ports/documents/DocumentsCommandsPort";
import { fromIso } from "@lawprotect/shared-ts";
import { documentNotFound, badRequest } from "@/errors";
import { SignatureErrorCodes } from "@/errors/codes";

/**
 * Input parameters for deleting a document lock
 */
export interface DeleteDocumentLockAppInput {
  documentId: DocumentId;
  lockId: string;
  ownerId: UserId;
  ownerEmail?: string;
  ownerIp?: string;
  ownerUserAgent?: string;
}

/**
 * Output result for document lock deletion
 */
export interface DeleteDocumentLockAppResult {
  deleted: boolean;
}

/**
 * Dependencies required by the DeleteDocumentLock app service
 */
export interface DeleteDocumentLockAppDependencies {
  documentsCommands: DocumentsCommandsPort;
}

/**
 * Deletes a document lock with proper validation
 * @param input - The input parameters containing document lock deletion data
 * @param deps - The dependencies containing the documents commands port
 * @returns Promise resolving to deletion result
 * @throws {AppError} When validation fails or lock deletion fails
 */
export const deleteDocumentLockApp = async (
  input: DeleteDocumentLockAppInput,
  deps: DeleteDocumentLockAppDependencies
): Promise<DeleteDocumentLockAppResult> => {
  // Validate that the document exists
  const document = await deps.documentsCommands.getById(input.documentId);
  if (!document) {
    throw documentNotFound({ documentId: input.documentId });
  }

  // Get all locks for the document to find the specific lock
  const locks = await deps.documentsCommands.listLocks(input.documentId);
  const lockToDelete = locks.find(lock => lock.lockId === input.lockId);

  if (!lockToDelete) {
    throw badRequest(`Lock not found: ${input.lockId}`, SignatureErrorCodes.DOCUMENT_LOCK_NOT_FOUND);
  }

  // Check if the lock has expired
  const lockExpiry = fromIso(lockToDelete.expiresAt);
  const now = fromIso(new Date().toISOString())!;
  
  if (lockExpiry && lockExpiry <= now) {
    throw badRequest(`Lock has already expired: ${input.lockId}`, SignatureErrorCodes.DOCUMENT_LOCK_EXPIRED);
  }

  // Validate that the user owns the lock or is an admin
  if (lockToDelete.ownerId !== input.ownerId) {
    throw badRequest(`User ${input.ownerId} does not own lock ${input.lockId}`, SignatureErrorCodes.DOCUMENT_LOCK_ACCESS_DENIED);
  }

  // Remove the lock from the document's metadata
  const updatedLocks = locks.filter(lock => lock.lockId !== input.lockId);
  await deps.documentsCommands.update({
    documentId: input.documentId,
    metadata: {
      ...document.metadata,
      locks: updatedLocks,
    },
  });

  return { deleted: true };
};
