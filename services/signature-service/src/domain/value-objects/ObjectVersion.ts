import { TrimmedString } from "@lawprotect/shared-ts";
import type { Brand } from "@lawprotect/shared-ts";

/**
 * ETag branded string.
 */
export type ETag = Brand<string, "ETag">;

/**
 * VersionId branded string.
 */
export type VersionId = Brand<string, "VersionId">;

export const ETagSchema = TrimmedString.transform((v) => v as ETag);
export const VersionIdSchema = TrimmedString.transform((v) => v as VersionId);
