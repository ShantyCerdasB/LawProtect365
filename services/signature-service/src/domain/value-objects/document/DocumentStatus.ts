/**
 * @file DocumentStatus.ts
 * @summary Document status value object for lifecycle management
 * @description Document status value object for lifecycle management.
 * Provides schema for document lifecycle status with proper validation
 * and type safety for document state transitions.
 */

import { z } from "@lawprotect/shared-ts";
import { DOCUMENT_STATUSES } from "../../values/enums";

/**
 * @description Document lifecycle status schema.
 * Validates that the status is one of the supported document lifecycle states.
 */
export const DocumentStatusSchema = z.enum(DOCUMENT_STATUSES);
export type DocumentStatus = z.infer<typeof DocumentStatusSchema>;






