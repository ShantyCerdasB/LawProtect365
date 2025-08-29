import { z } from "zod";
import { KMS_ALGORITHMS } from "../values/enums";

const TrimmedString = z.string().trim();

type Brand<T, B> = T & { readonly __brand: B };

/**
 * KMS key identifier (ARN or key id) branded.
 */
export type KmsKeyId = Brand<string, "KmsKeyId">;

export const KmsKeyIdSchema = TrimmedString.transform((v) => v as KmsKeyId);

/**
 * KMS signing algorithm enumeration.
 */
export const KmsAlgorithmSchema = z.enum(KMS_ALGORITHMS);
export type KmsAlgorithmType = z.infer<typeof KmsAlgorithmSchema>;
