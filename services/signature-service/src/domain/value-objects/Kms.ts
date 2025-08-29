/**
 * @file Kms.ts
 * @summary KMS value objects for key identifiers and algorithms
 * @description KMS value objects for key identifiers and algorithms.
 * Provides branded types and schemas for KMS key IDs and signing algorithms
 * with proper validation and type safety.
 */

import { z } from "zod";
import { KMS_ALGORITHMS } from "../values/enums";

const TrimmedString = z.string().trim();

type Brand<T, B> = T & { readonly __brand: B };

/**
 * @description KMS key identifier (ARN or key id) branded.
 * Provides compile-time type safety for KMS key identifiers.
 */
export type KmsKeyId = Brand<string, "KmsKeyId">;

/**
 * @description KMS key identifier schema with validation.
 * Validates and transforms string input to branded KmsKeyId type.
 */
export const KmsKeyIdSchema = TrimmedString.transform((v) => v as KmsKeyId);

/**
 * @description KMS signing algorithm enumeration.
 * Validates that the algorithm is one of the supported KMS signing algorithms.
 */
export const KmsAlgorithmSchema = z.enum(KMS_ALGORITHMS);
export type KmsAlgorithmType = z.infer<typeof KmsAlgorithmSchema>;
