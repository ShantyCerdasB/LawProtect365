/**
 * @file CreateEnvelope.schema.ts
 * @description Request and response schemas for creating envelopes.
 * Defines Zod schemas for envelope creation payload validation and response formatting.
 */

/**
 * @file CreateEnvelope.schema.ts
 * @summary Request/response schemas for creating an envelope.
 */

import { z } from "@lawprotect/shared-ts";
import { UuidV4 } from "@lawprotect/shared-ts";

/**
 * @description Body payload schema for creating an envelope.
 * Validates the required fields for envelope creation including name, description, and owner.
 */
export const CreateEnvelopeBody = z.object({
  /** Envelope name (1-255 characters) */
  name: z.string().min(1).max(255),
  /** Optional envelope description (max 1000 characters) */
  description: z.string().max(1000).optional(),
  /** Owner identifier (UUID v4) */
  ownerId: UuidV4,
});
export type CreateEnvelopeBody = z.infer<typeof CreateEnvelopeBody>;

/**
 * @description Response payload schema for a newly created envelope.
 * Defines the structure of the response returned after successful envelope creation.
 */
export const CreateEnvelopeResponse = z.object({
  /** Created envelope identifier (UUID v4) */
  id: UuidV4,
  /** Creation timestamp (ISO datetime string) */
  createdAt: z.string().datetime(),
});
export type CreateEnvelopeResponse = z.infer<typeof CreateEnvelopeResponse>;
