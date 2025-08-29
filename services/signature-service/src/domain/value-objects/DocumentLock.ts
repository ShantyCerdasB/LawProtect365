/**
 * @file DocumentLock.ts
 * @summary Document lock value object for editing control
 * @description Document lock value object for managing concurrent editing access.
 * Provides schema for document locks with proper validation and type safety.
 */

import { z } from "@lawprotect/shared-ts";

/**
 * @description Document lock schema for editing control.
 * Validates lock properties including owner, expiration, and metadata.
 */
export const DocumentLockSchema = z.object({
  lockId: z.string().min(1),
  documentId: z.string().min(1),
  ownerId: z.string().min(1),
  ownerEmail: z.string().email().optional(),
  expiresAt: z.string().datetime(),
  createdAt: z.string().datetime(),
  metadata: z.record(z.unknown()).optional(),
});

export type DocumentLock = z.infer<typeof DocumentLockSchema>;

/**
 * @description Document lock creation input schema.
 */
export const CreateDocumentLockSchema = z.object({
  documentId: z.string().min(1),
  ownerId: z.string().min(1),
  ownerEmail: z.string().email().optional(),
  ttlSeconds: z.number().int().positive().default(300), // 5 minutes default
  metadata: z.record(z.unknown()).optional(),
});

export type CreateDocumentLockInput = z.infer<typeof CreateDocumentLockSchema>;
