/**
 * @file ContentType.ts
 * @summary Content type value object for document validation
 * @description Content type value object for document validation.
 * Provides schema for whitelisted content types used by documents and thumbnails
 * with proper validation and type safety.
 */

import { z } from "@lawprotect/shared-ts";
import { ALLOWED_CONTENT_TYPES } from "../../values/enums";

/**
 * @description Whitelisted content types schema used by documents and thumbnails.
 * Validates that the content type is one of the allowed types for security.
 */
export const ContentTypeSchema = z.enum(ALLOWED_CONTENT_TYPES);
export type ContentType = z.infer<typeof ContentTypeSchema>;



