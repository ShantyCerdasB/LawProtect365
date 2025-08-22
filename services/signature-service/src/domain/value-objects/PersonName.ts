import { z, TrimmedString, CollapsedWhitespace } from "@lawprotect/shared-ts";

/**
 * Person name value object with display and optional given/family parts.
 */
export interface PersonName {
  display: string;
  given?: string;
  family?: string;
}

/**
 * Schema that builds display when not provided using given/family.
 */
export const PersonNameSchema = z
  .object({
    display: TrimmedString.pipe(CollapsedWhitespace).optional(),
    given: TrimmedString.pipe(CollapsedWhitespace).optional(),
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
