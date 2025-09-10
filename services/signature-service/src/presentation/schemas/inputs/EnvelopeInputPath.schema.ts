/**
 * @file EnvelopeInputPath.schema.ts
 * @description Path parameter schemas for envelope and input operations.
 * Defines Zod schemas for validating path parameters in input-related endpoints.
 */

/**
 * @file EnvelopeInputPath.schema.ts
 * @summary Path parameter schemas for envelope and input operations.
 */

import { z } from "@lawprotect/shared-ts";
import { EnvelopeId, InputId } from "../common/path";

/**
 * @description Path parameters schema for envelope operations.
 * Validates envelope ID in path parameters.
 */
export const EnvelopePath = z.object({
  /** Envelope identifier */
  envelopeId: EnvelopeId,
});
export type EnvelopePath = z.infer<typeof EnvelopePath>;

/**
 * @description Path parameters schema for input operations.
 * Validates envelope ID and input ID in path parameters.
 */
export const EnvelopeInputPath = z.object({
  /** Envelope identifier (UUID v4) */
  envelopeId: EnvelopeId,
  /** Input identifier (UUID v4) */
  inputId: InputId,
});
export type EnvelopeInputPath = z.infer<typeof EnvelopeInputPath>;








