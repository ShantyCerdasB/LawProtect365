/**
 * @file documentLock.ts
 * @summary Document lock types for concurrent access control
 * @description Types for managing concurrent editing access to documents
 */

import type { UserId } from "./brand.js";

/**
 * @description Document lock entity for editing control
 * Prevents conflicts when multiple users try to edit the same document simultaneously
 */
export interface DocumentLock {
  /** Unique identifier of the lock */
  lockId: string;
  /** Document being locked */
  documentId: string;
  /** User who owns the lock */
  ownerId: UserId;
  /** Email of the lock owner (optional) */
  ownerEmail?: string;
  /** IP address of the lock owner (optional) */
  ownerIp?: string;
  /** User agent of the lock owner (optional) */
  ownerUserAgent?: string;
  /** ISO-8601 timestamp when the lock expires */
  expiresAt: string;
  /** ISO-8601 timestamp when the lock was created */
  createdAt: string;
  /** Optional metadata for extensibility */
  metadata?: Record<string, unknown>;
}


