import { z, TrimmedString } from "@lawprotect/shared-ts";
import type { Brand } from "@lawprotect/shared-ts";

/**
 * Opaque base64url pagination cursor.
 */
export type PaginationCursor = Brand<string, "PaginationCursor">;

const Base64UrlNoPad = /^[A-Za-z0-9_-]+$/;

export const PaginationCursorSchema = TrimmedString
  .pipe(z.string().regex(Base64UrlNoPad, "Expected base64url"))
  .transform((v) => v as PaginationCursor);
