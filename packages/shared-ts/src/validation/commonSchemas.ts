import { z } from "zod";

/**
 * Common reusable Zod schemas (strings, dates, numbers).
 */

export const NonEmptyString = z.string().min(1, "Required");

export const SafeString = z
  .string()
  .refine((s) => !/[\u0000-\u001F\u007F]/.test(s), "Control characters not allowed");

export const ISODateString = z
  .string()
  .refine((s) => !Number.isNaN(Date.parse(s)), "Invalid ISO-8601 timestamp");

export const EmailString = z.string().email("Invalid email");

export const PositiveInt = z.number().int().positive();

export const JsonUnknown: z.ZodType<unknown> = z.any();

export const JsonObject = z.record(z.any()).default({});
