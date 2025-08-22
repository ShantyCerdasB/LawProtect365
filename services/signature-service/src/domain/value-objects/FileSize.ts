import { z } from "@lawprotect/shared-ts";

/**
 * File size in bytes with configurable bounds.
 */
export const FileSizeSchema = (min = 1, max = 50 * 1024 * 1024) =>
  z.number().int().min(min).max(max);

export type FileSize = number;
