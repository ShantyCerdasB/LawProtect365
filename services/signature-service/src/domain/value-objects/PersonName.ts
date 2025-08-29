/**
 * @file PersonName.ts
 * @summary Person name value object with display and component parts
 * @description Person name value object with display and optional given/family parts.
 * Provides flexible name representation with automatic display name generation from components.
 */

import { z, TrimmedString, CollapsedWhitespace } from "@lawprotect/shared-ts";

/**
 * @description Person name value object with display and optional given/family parts.
 * Supports both simple display names and structured name components.
 */
export interface PersonName {
  /** Full display name (required) */
  display: string;
  /** Given/first name (optional) */
  given?: string;
  /** Family/last name (optional) */
  family?: string;
}

/**
 * @description Schema that builds display when not provided using given/family.
 * Validates and normalizes name components, automatically generating display name if not provided.
 */
export const PersonNameSchema = z
  .object({
    /** Full display name (optional, will be generated from given/family if not provided) */
    display: TrimmedString.pipe(CollapsedWhitespace).optional(),
    /** Given/first name (optional) */
    given: TrimmedString.pipe(CollapsedWhitespace).optional(),
    /** Family/last name (optional) */
    family: TrimmedString.pipe(CollapsedWhitespace).optional(),
  })
  .refine((v) => Boolean(v.display || v.given || v.family), {
    message: "At least one of display, given or family is required",
  })
  .transform<PersonName>((v) => {
    const display =
      v.display ?? [v.given, v.family].filter(Boolean).join(" ").trim();
    return { display, given: v.given, family: v.family };
  });
