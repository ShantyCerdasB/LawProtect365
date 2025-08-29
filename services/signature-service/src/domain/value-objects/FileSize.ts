/**
 * @file FileSize.ts
 * @summary File size value object with configurable bounds
 * @description File size value object with configurable bounds.
 * Provides schema for file size validation with minimum and maximum byte limits
 * for document upload and storage operations.
 */

import { z } from "@lawprotect/shared-ts";

/**
 * @description File size schema with configurable bounds.
 * Validates that the file size is an integer within the specified range.
 *
 * @param {number} min - Minimum file size in bytes (default: 1)
 * @param {number} max - Maximum file size in bytes (default: 50MB)
 * @returns {z.ZodNumber} Zod schema for file size validation
 */
export const FileSizeSchema = (min = 1, max = 50 * 1024 * 1024) =>
  z.number().int().min(min).max(max);

export type FileSize = number;
