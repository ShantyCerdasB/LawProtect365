/**
 * @file AddViewer.schema.ts
 * @summary Request schema for adding viewers to an envelope.
 * @description Defines the request body structure for adding viewers with read-only access to an envelope.
 */

import { z } from "@lawprotect/shared-ts";

/**
 * @description Body payload for adding a viewer to an envelope.
 * Contains email and optional name and locale for the viewer.
 */
export const AddViewerBody = z.object({
  /** Email address of the viewer to add. */
  email: z.string().email("Invalid email address"),
  /** Optional name of the viewer. */
  name: z.string().max(255, "Name must be 255 characters or less").optional(),
  /** Optional locale preference for the viewer. */
  locale: z.string().max(10, "Locale must be 10 characters or less").optional(),
});

export type AddViewerBody = z.infer<typeof AddViewerBody>;
