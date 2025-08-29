/**
 * @file CreateDocumentLockApp.service.ts
 * @summary Application service for creating document locks
 * @description Orchestrates document lock creation operations, delegates to DocumentsCommandsPort,
 * and handles validation logic. Uses branded types for type safety.
 */

import type { DocumentId, UserId } from "@/app/ports/shared";
import type { DocumentsCommandsPort } from "@/app/ports/documents/DocumentsCommandsPort";
import { nowIso, fromIso, addMinutes, toIso } from "@lawprotect/shared-ts";
import { documentNotFound, documentLockExists } from "@/errors";

/**
 * Input parameters for creating a document lock
 */
export interface CreateDocumentLockAppInput {
  documentId: DocumentId;
  ownerId: UserId;
  ownerEmail?: string;
  ownerIp?: string;
  ownerUserAgent?: string;
  ttlSeconds?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Output result for document lock creation
 */
export interface CreateDocumentLockAppResult {
  lockId: string;
  expiresAt: string;
}

/**
 * Dependencies required by the CreateDocumentLock app service
 */
export interface CreateDocumentLockAppDependencies {
  documentsCommands: DocumentsCommandsPort;
}

/**
 * Creates a document lock with proper validation
 * @param input - The input parameters containing document lock creation data
 * @param deps - The dependencies containing the documents commands port
 * @returns Promise resolving to created lock data
 * @throws {AppError} When validation fails or lock creation fails
 */
export const createDocumentLockApp = async (
  input: CreateDocumentLockAppInput,
  deps: CreateDocumentLockAppDependencies
): Promise<CreateDocumentLockAppResult> => {
  // Validate that the document exists
  const document = await deps.documentsCommands.getById(input.documentId);
  if (!document) {
    throw documentNotFound({ documentId: input.documentId });
  }

  // Check if there's already an active lock on this document
  const existingLocks = await deps.documentsCommands.listLocks(input.documentId);
  const now = fromIso(nowIso())!;
  const activeLock = existingLocks.find(lock => {
    const lockExpiry = fromIso(lock.expiresAt);
    return lockExpiry && lockExpiry > now;
  });
  
  if (activeLock) {
    throw documentLockExists({ 
      documentId: input.documentId,
      existingLock: activeLock,
      ownerEmail: activeLock.ownerEmail || activeLock.ownerId,
      expiresAt: activeLock.expiresAt
    });
  }

  // Generate lock ID and calculate expiration
  const lockId = `lock_${input.documentId}_${Date.now()}`;
  const ttlMinutes = Math.floor((input.ttlSeconds || 300) / 60); // Convert seconds to minutes
  const expiresAt = toIso(addMinutes(now, ttlMinutes));

  // Create the lock
  await deps.documentsCommands.createLock({
    lockId,
    documentId: input.documentId,
    ownerId: input.ownerId,
    ownerEmail: input.ownerEmail,
    expiresAt,
    createdAt: nowIso(),
    metadata: input.metadata,
  });

  return { 
    lockId,
    expiresAt
  };
};
