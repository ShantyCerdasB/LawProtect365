/**
 * @file Geometry.ts
 * @summary 2D geometry value objects for document positioning
 * @description 2D geometry value objects for document positioning and layout.
 * Provides schemas for pixel positions and rectangles with validation for document coordinate systems.
 */

import { z } from "@lawprotect/shared-ts";
import { PageNumberSchema } from "./Page";

/**
 * @description 2D pixel position schema (origin at top-left).
 * Defines coordinates for positioning elements on document pages.
 */
export const PixelPositionSchema = z.object({
  /** X coordinate (pixels from left edge) */
  x: z.number().min(0),
  /** Y coordinate (pixels from top edge) */
  y: z.number().min(0),
  /** Optional page number */
  page: PageNumberSchema.optional(),
});
export type PixelPosition = z.infer<typeof PixelPositionSchema>;

/**
 * @description 2D rectangle schema (origin at top-left).
 * Defines rectangular areas with position and dimensions for document elements.
 */
export const RectSchema = z
  .object({
    /** X coordinate (pixels from left edge) */
    x: z.number().min(0),
    /** Y coordinate (pixels from top edge) */
    y: z.number().min(0),
    /** Rectangle width (positive value) */
    width: z.number().positive(),
    /** Rectangle height (positive value) */
    height: z.number().positive(),
    /** Optional page number */
    page: PageNumberSchema.optional(),
  })
  .refine((r) => r.width > 0 && r.height > 0, { message: "width and height must be > 0" });

export type Rect = z.infer<typeof RectSchema>;
