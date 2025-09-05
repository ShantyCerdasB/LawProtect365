/**
 * @file Consent.schema.ts
 * @summary Request schema for user consent during the signing process.
 */

import { z, UuidV4 } from "@lawprotect/shared-ts";

/** Body payload for signing consent. */
export const ConsentBody = z.object({
  envelopeId: UuidV4,
  signerId: UuidV4,
  consent: z.boolean(),
});
export type ConsentBody = z.infer<typeof ConsentBody>;
