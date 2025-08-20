/**
 * @file CompleteSigning.schema.ts
 * @summary Request schema for completing the signing process.
 */

import { z } from "@lawprotect/shared-ts";
import { UuidV4 } from "@lawprotect/shared-ts";

/** Body payload for completing signing. */
export const CompleteSigningBody = z.object({
  envelopeId: UuidV4,
  signerId: UuidV4,
  signature: z.string().min(1),
});
export type CompleteSigningBody = z.infer<typeof CompleteSigningBody>;
