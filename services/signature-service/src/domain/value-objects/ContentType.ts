import { z } from "@lawprotect/shared-ts";
import { ALLOWED_CONTENT_TYPES } from "../values/enums";

/** Whitelisted content types used by documents and thumbnails. */
export const ContentTypeSchema = z.enum(ALLOWED_CONTENT_TYPES);
export type AllowedContentType = z.infer<typeof ContentTypeSchema>;
