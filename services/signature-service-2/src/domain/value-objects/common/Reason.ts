/**
 * @file Reason.ts
 * @summary Reason validation schema
 * @description Zod schema for validating reason strings with appropriate length limits
 */

import { z } from "@lawprotect/shared-ts";

/**
 * @summary Reason validation schema
 * @description Validates reason string with length constraints
 */
export const ReasonSchema = z.string().min(1, "Reason cannot be empty").max(1000, "Reason too long");
