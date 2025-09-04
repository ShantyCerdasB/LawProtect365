/**
 * @file IdempotencyKeyTypes.ts
 * @summary Types for idempotency key generation and handling
 * @description Defines interfaces and types for idempotency key operations
 */

import type { IdempotencyKeyInputSchema } from "../../validations/schemas/idempotency";

/**
 * @summary Result of idempotency key derivation
 * @description Contains the generated hash key and the original input
 */
export interface IdempotencyKeyResult {
  /** The SHA-256 hash key derived from the input */
  key: string;
  /** The original input used to generate the key */
  input: IdempotencyKeyInputSchema;
}
