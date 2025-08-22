import { z } from "@lawprotect/shared-ts";

/**
 * Whitelisted content types used by documents and thumbnails.
 */
export const AllowedContentTypes = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
] as const;

export const ContentTypeSchema = z.enum(AllowedContentTypes);
export type ContentType = typeof AllowedContentTypes[number];
