import { z } from "zod";
import { AppError } from "../errors/AppError.js";
import { ErrorCodes } from "../errors/codes.js";

/**
 * Environment loader using Zod schemas.
 * Validates process.env and returns a typed config object.
 */

/**
 * Normalizes common ENV aliases to a canonical set used across the platform.
 * Accepted inputs (case-insensitive):
 *  - dev|development -> "dev"
 *  - stg|stage|staging -> "staging"
 *  - prod|production -> "prod"
 *  - test|tst -> "test"
 * Throws for unsupported values to surface misconfiguration early.
 */
const normalizeEnv = (value: unknown): "dev" | "staging" | "prod" | "test" => {
  const raw = String(value ?? "").trim().toLowerCase();
  if (raw === "" || raw === "dev" || raw === "development") return "dev";
  if (raw === "stg" || raw === "stage" || raw === "staging") return "staging";
  if (raw === "prod" || raw === "production") return "prod";
  if (raw === "test" || raw === "tst") return "test";
  // Keep strict validation: throw to surface misconfiguration
  throw new Error(`Unsupported ENV value "${String(value)}" (allowed: dev|stg|staging|prod|test)`);
};

export const Env = z.object({
  ENV: z
    .string()
    .optional()
    .transform((v) => normalizeEnv(v))
    .default("dev"),
  PROJECT_NAME: z.string().min(1).default("lawprotect"),
  SERVICE_NAME: z.string().min(1).default("auth-service"),
  AWS_REGION: z.string().min(1).default("us-east-1"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error", "silent"]).default("info"),
  JWT_ISSUER: z.string().url().optional(),
  JWT_AUDIENCE: z.string().optional()
});

/**
 * Loads and validates environment variables using a Zod schema.
 * @param schema Zod object schema describing env vars.
 */
export const loadEnv = <T extends Record<string, unknown>>(schema: z.ZodType<T>): T => {
  const input = Object.fromEntries(
    Object.entries(process.env).filter(([_, v]) => v != null)
  ) as Record<string, unknown>;

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
