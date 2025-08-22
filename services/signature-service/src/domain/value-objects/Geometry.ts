import { z } from "@lawprotect/shared-ts";
import { PageNumberSchema } from "./Page";

/**
 * 2D pixel position (origin at top-left).
 */
export const PixelPositionSchema = z.object({
  x: z.number().min(0),
  y: z.number().min(0),
  page: PageNumberSchema.optional(),
});
export type PixelPosition = z.infer<typeof PixelPositionSchema>;

/**
 * 2D rectangle (origin at top-left).
 */
export const RectSchema = z
  .object({
    x: z.number().min(0),
    y: z.number().min(0),
    width: z.number().positive(),
    height: z.number().positive(),
    page: PageNumberSchema.optional(),
  })
  .refine((r) => r.width > 0 && r.height > 0, { message: "width and height must be > 0" });

export type Rect = z.infer<typeof RectSchema>;
