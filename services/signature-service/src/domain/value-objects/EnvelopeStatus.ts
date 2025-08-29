/**
 * @file EnvelopeStatus.ts
 * @summary Envelope status value object for lifecycle management
 * @description Envelope status value object for lifecycle management.
 * Provides schema for envelope lifecycle status with proper validation
 * and type safety for envelope state transitions.
 */

import { z } from "@lawprotect/shared-ts";
import { ENVELOPE_STATUSES } from "../values/enums";

/**
 * @description Envelope lifecycle status schema.
 * Validates that the status is one of the supported envelope lifecycle states.
 */
export const EnvelopeStatusSchema = z.enum(ENVELOPE_STATUSES);
export type EnvelopeStatus = z.infer<typeof EnvelopeStatusSchema>;