/**
 * @file PaginationCursor.ts
 * @summary Pagination cursor value object for forward-only pagination
 * @description Pagination cursor value object for forward-only pagination.
 * Provides branded type and schema for opaque base64url pagination cursors
 * with proper validation for secure pagination operations.
 */

import { z, TrimmedString, Base64UrlNoPad } from "@lawprotect/shared-ts";
import type { Brand } from "@lawprotect/shared-ts";

/**
 * @description Opaque base64url pagination cursor branded type.
 * Provides compile-time type safety for pagination cursors.
 */
export type PaginationCursor = Brand<string, "PaginationCursor">;


/**
 * @description Pagination cursor schema with validation.
 * Validates base64url format and transforms to branded type.
 */
export const PaginationCursorSchema = TrimmedString
  .pipe(z.string().regex(Base64UrlNoPad, "Expected base64url"))
  .transform((v) => v as PaginationCursor);






