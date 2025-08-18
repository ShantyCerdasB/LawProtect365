import { z } from "zod";

/**
 * Identifier validators: UUID, ULID, S3 URI and opaque IDs.
 */

export const UuidV4 = z.string().uuid();

export const Ulid = z
  .string()
  .regex(/^[0-9A-HJKMNP-TV-Z]{26}$/i, "Invalid ULID");

export const OpaqueId = z.string().min(1);

export const S3Uri = z
  .string()
  .startsWith("s3://", "Must start with s3://")
  .refine((v) => v.slice(5).length > 0, "Bucket or key missing");
