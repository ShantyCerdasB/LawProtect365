/**
 * @file CompleteSigningWithToken.schema.ts
 * @summary Schema for completing signing with invitation token
 * @description Defines validation schemas for unauthenticated signing using invitation tokens
 */

import { HASH_ALGORITHM, KMS_ALGORITHMS } from "@/domain/values/enums";
import { z, UuidV4 } from "@lawprotect/shared-ts";

/** Path parameters for completing signing with token */
export const CompleteSigningWithTokenPath = z.object({
  id: UuidV4 // envelopeId
}).strict();

/** Body payload for completing signing with invitation token */
export const CompleteSigningWithTokenBody = z
  .object({
    signerId: UuidV4,
    digest: z.object({
      alg: z.enum(HASH_ALGORITHM),
      value: z
        .string()
        .min(1)
        .regex(/^[A-Za-z0-9_-]+$/, "Expected base64url without padding")
    }),
    algorithm: z.enum(KMS_ALGORITHMS),
    keyId: z.string().min(1).optional(),
    token: z.string().min(1) // Invitation token (required for unauthenticated signing)
  })
  .strict();

/** Combined schema for the controller */
export const CompleteSigningWithTokenSchema = {
  path: CompleteSigningWithTokenPath,
  body: CompleteSigningWithTokenBody
};

export type CompleteSigningWithTokenPath = z.infer<typeof CompleteSigningWithTokenPath>;
export type CompleteSigningWithTokenBody = z.infer<typeof CompleteSigningWithTokenBody>;
