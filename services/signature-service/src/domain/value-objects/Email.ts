/**
 * @file Email.ts
 * @summary Email value object with normalization and validation
 * @description Email value object with normalization and RFC validation.
 * Provides branded email type and schema for consistent email handling across the domain.
 */

import { NormalizedEmail } from "@lawprotect/shared-ts";
import type { Brand } from "@lawprotect/shared-ts";

/**
 * @description Normalized email (trimmed + lowercased) with RFC validation.
 * Branded type for compile-time email validation.
 */
export type Email = Brand<string, "Email">;

/**
 * @description Email schema with normalization.
 * Validates and normalizes email addresses according to RFC standards.
 */
export const EmailSchema = NormalizedEmail.transform((v) => v as Email);
