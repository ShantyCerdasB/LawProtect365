import { NormalizedEmail } from "@lawprotect/shared-ts";
import type { Brand } from "@lawprotect/shared-ts";

/**
 * Normalized email (trimmed + lowercased) with RFC validation.
 */
export type Email = Brand<string, "Email">;

/**
 * Email schema with normalization.
 */
export const EmailSchema = NormalizedEmail.transform((v) => v as Email);
