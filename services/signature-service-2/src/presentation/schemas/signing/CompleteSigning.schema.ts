import { HASH_ALGORITHM, KMS_ALGORITHMS } from "@/domain/values/enums";
import { z, UuidV4 } from "@lawprotect/shared-ts";

/** Body payload for completing signing. */
export const CompleteSigningBody = z
  .object({
    signerId: UuidV4,
    
    /** URL of the final PDF from Documents Service (with embedded fields and signatures) */
    finalPdfUrl: z.string().url(),

    digest: z.object({
      alg: z.enum(HASH_ALGORITHM),
      value: z
        .string()
        .min(1)
        .regex(/^[A-Za-z0-9_-]+$/, "Expected base64url without padding")}),

    algorithm: z.enum(KMS_ALGORITHMS), // ✅ sin corchetes extra

    keyId: z.string().min(1).optional()
  })
  .strict();

export type CompleteSigningBody = z.infer<typeof CompleteSigningBody>;

