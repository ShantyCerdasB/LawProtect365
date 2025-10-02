import { z } from "zod";

/**
 * Centralized Zod export with a shared error map.
 * 
 * This module ensures consistent validation error messages
 * across services by overriding Zod's default error map.
 * 
 * Use this instead of importing Zod directly.
 *
 * @remarks
 * - Applies a custom error map for common validation issues.
 * - Provides clear and standardized error messages for consumers.
 * - Keeps consistency across API layers and services.
 *
 * @example
 * ```ts
 * import { z } from "../validation/z";
 * 
 * const schema = z.object({
 *   id: z.string().uuid(),
 * });
 * 
 * schema.parse({ id: "not-a-uuid" });
 * // => Throws error with standardized message
 * ```
 */
z.setErrorMap((issue, ctx) => {
  switch (issue.code) {
    case "invalid_type":
      return {
        message: `Expected ${issue.expected}, received ${issue.received}`};
    case "too_small":
      return {
        message: "Value is too small"};
    case "too_big":
      return {
        message: "Value is too large"};
    case "invalid_string":
      if (issue.validation === "uuid") {
        return { message: "Invalid UUID format" };
      }
      if (issue.validation === "email") {
        return { message: "Invalid email address" };
      }
      return { message: "Invalid string format" };
    default:
      return { message: ctx.defaultError };
  }
});

/**
 * Re-export of Zod with the custom error map applied.
 *
 * @public
 */
export { z } from 'zod';
