import { z } from "zod";
import { AppError } from "@errors/AppError.js";
import { ErrorCodes } from "@errors/codes.js";

/**
 * Environment loader using Zod schemas.
 * Validates process.env and returns a typed config object.
 */

export const Env = z.object({
  ENV: z.enum(["dev", "staging", "prod"]).default("dev"),
  PROJECT_NAME: z.string().min(1),
  SERVICE_NAME: z.string().min(1),
  AWS_REGION: z.string().min(1),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  JWT_ISSUER: z.string().url().optional(),
  JWT_AUDIENCE: z.string().optional()
});

/**
 * Loads and validates environment variables using a Zod schema.
 * @param schema Zod object schema describing env vars.
 */
export const loadEnv = <T extends Record<string, unknown>>(schema: z.ZodType<T>): T => {
  const input = Object.fromEntries(Object.entries(process.env).filter(([_, v]) => v != null)) as Record<
    string,
    unknown
  >;
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    throw new AppError(
      ErrorCodes.COMMON_INTERNAL_ERROR,
      500,
      "Invalid server configuration",
      { issues: parsed.error.issues }
    );
  }
  return parsed.data;
};
