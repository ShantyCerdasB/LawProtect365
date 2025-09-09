/**
 * @file EnvelopeInputPath.schema.ts
 * @description Path parameter schemas for envelope and input operations.
 * Defines Zod schemas for validating path parameters in input-related endpoints.
 */

/**
 * @file EnvelopeInputPath.schema.ts
 * @summary Path parameter schemas for envelope and input operations.
 */

import { z, UuidV4 } from "@lawprotect/shared-ts";

/**
 * @description Path parameters schema for envelope operations.
 * Validates envelope ID in path parameters.
 */
export const EnvelopePath = z.object({
  /** Envelope identifier (UUID v4) */
  envelopeId: UuidV4,
});
export type EnvelopePath = z.infer<typeof EnvelopePath>;

/**
 * @description Path parameters schema for input operations.
 * Validates envelope ID and input ID in path parameters.
 */
export const EnvelopeInputPath = z.object({
  /** Envelope identifier (UUID v4) */
  envelopeId: UuidV4,
  /** Input identifier (UUID v4) */
  inputId: UuidV4,
});
export type EnvelopeInputPath = z.infer<typeof EnvelopeInputPath>;








