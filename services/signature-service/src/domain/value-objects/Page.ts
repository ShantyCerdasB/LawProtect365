import { z } from "@lawprotect/shared-ts";

/**
 * 1-based page number.
 */
export const PageNumberSchema = z.number().int().positive();
export type PageNumber = z.infer<typeof PageNumberSchema>;

/**
 * Inclusive page range with from <= to.
 */
export const PageRangeSchema = z
  .object({
    from: PageNumberSchema,
    to: PageNumberSchema,
  })
  .refine((v) => v.from <= v.to, { message: "`from` must be <= `to`" });

export type PageRange = z.infer<typeof PageRangeSchema>;
