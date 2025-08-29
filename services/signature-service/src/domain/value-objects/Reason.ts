/**
 * @file Reason.ts
 * @summary Reason value object for decline/cancel actions
 * @description Reason value object for decline/cancel actions.
 * Provides schema for safe reason strings used in envelope decline and cancellation operations.
 */

import { TrimmedString } from "@lawprotect/shared-ts";

/**
 * @description Safe reason string schema for decline/cancel actions.
 * Uses trimmed string validation for consistent reason handling.
 */
export const ReasonSchema = TrimmedString; 
export type Reason = string;
