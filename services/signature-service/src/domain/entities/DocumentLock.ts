/**
 * @file DocumentLock.ts
 * @summary Document lock entity for editing control
 * @description Document lock entity for managing concurrent editing access to documents.
 * Prevents conflicts when multiple users try to edit the same document simultaneously.
 */

import type { DocumentId, UserId } from "../value-objects/Ids";

/**
 * Document lock entity for editing control.
 */
export interface DocumentLock {
  /** Unique identifier of the lock. */
  lockId: string;

  /** Document being locked. */
  documentId: DocumentId;

  /** User who owns the lock. */
  ownerId: UserId;

  /** Email of the lock owner (optional). */
  ownerEmail?: string;

  /** IP address of the lock owner (optional). */
  ownerIp?: string;

  /** User agent of the lock owner (optional). */
  ownerUserAgent?: string;

  /** ISO-8601 timestamp when the lock expires. */
  expiresAt: string;

  /** ISO-8601 timestamp when the lock was created. */
  createdAt: string;

  /** Optional metadata for extensibility. */
  metadata?: Record<string, unknown>;
}
