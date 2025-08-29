/**
 * @file InputType.ts
 * @summary Input type value object for signing flows
 * @description Input type value object for signing flows.
 * Provides schema for supported input types used in document signing operations
 * with proper validation and type safety.
 */

import { z } from "@lawprotect/shared-ts";
import { INPUT_VALUES } from "../values/enums";

/**
 * @description Supported input types schema for signing flows.
 * Validates that the input type is one of the supported types for document signing.
 */
export const InputTypeSchema = z.enum(INPUT_VALUES);
export type InputType = z.infer<typeof InputTypeSchema>;