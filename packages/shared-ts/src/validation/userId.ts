import { z } from "./z.js";

/**
 * Validates that a string is a valid UUID v4 format.
 * 
 * @param value - The string to validate
 * @returns true if valid UUID v4, false otherwise
 */
const isUuidV4 = (value: string): boolean => {
  const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidV4Regex.test(value);
};

/**
 * Validates that a string is a valid UserId (non-empty UUID v4).
 * 
 * @param value - The string to validate
 * @returns true if valid UserId, false otherwise
 * 
 * @example
 * ```ts
 * isValidUserId("123e4567-e89b-12d3-a456-426614174000"); // true
 * isValidUserId("invalid"); // false
 * isValidUserId(""); // false
 * isValidUserId(undefined); // false
 * ```
 */
export const isValidUserId = (value: unknown): value is string => {
  return typeof value === 'string' && 
         value.length > 0 && 
         isUuidV4(value);
};

/**
 * Zod schema for UserId validation.
 * Validates that the input is a non-empty string and a valid UUID v4.
 * 
 * @example
 * ```ts
 * const schema = z.object({
 *   userId: UserIdSchema
 * });
 * 
 * schema.parse({ userId: "123e4567-e89b-12d3-a456-426614174000" }); // ✅
 * schema.parse({ userId: "invalid" }); // ❌ Throws validation error
 * ```
 */
export const UserIdSchema = z.string()
  .min(1, "User ID is required")
  .refine(isUuidV4, "User ID must be a valid UUID");
