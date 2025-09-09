/**
 * @file DeclineSigning.schema.ts
 * @summary Request schema for declining the signing process.
 */

import { z, UuidV4 } from "@lawprotect/shared-ts";

/** Body payload for declining signing. */
export const DeclineSigningBody = z.object({
  envelopeId: UuidV4,
  signerId: UuidV4,
  reason: z.string().max(500),
});
export type DeclineSigningBody = z.infer<typeof DeclineSigningBody>;






