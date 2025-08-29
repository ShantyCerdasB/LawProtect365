/**
 * @file Page.ts
 * @summary Page number and range value objects for document operations
 * @description Page number and range value objects for document operations.
 * Provides schemas for 1-based page numbers and inclusive page ranges
 * with validation for document pagination and page selection.
 */

import { z } from "@lawprotect/shared-ts";

/**
 * @description 1-based page number schema.
 * Validates that the page number is a positive integer.
 */
export const PageNumberSchema = z.number().int().positive();
export type PageNumber = z.infer<typeof PageNumberSchema>;

/**
 * @description Inclusive page range schema with from <= to validation.
 * Defines a range of pages with start and end page numbers.
 */
export const PageRangeSchema = z
  .object({
    /** Starting page number (inclusive) */
    from: PageNumberSchema,
    /** Ending page number (inclusive) */
    to: PageNumberSchema,
  })
  .refine((v) => v.from <= v.to, { message: "`from` must be <= `to`" });

export type PageRange = z.infer<typeof PageRangeSchema>;
