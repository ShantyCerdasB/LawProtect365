/**
 * @file ObjectVersion.ts
 * @summary Object version value objects for ETag and VersionId
 * @description Object version value objects for ETag and VersionId.
 * Provides branded types and schemas for object version identifiers
 * with proper validation and type safety for version management.
 */

import { TrimmedString } from "@lawprotect/shared-ts";
import type { Brand } from "@lawprotect/shared-ts";

/**
 * @description ETag branded string type.
 * Provides compile-time type safety for entity tags.
 */
export type ETag = Brand<string, "ETag">;

/**
 * @description VersionId branded string type.
 * Provides compile-time type safety for version identifiers.
 */
export type VersionId = Brand<string, "VersionId">;

/**
 * @description ETag schema with validation.
 * Validates and transforms string input to branded ETag type.
 */
export const ETagSchema = TrimmedString.transform((v) => v as ETag);

/**
 * @description VersionId schema with validation.
 * Validates and transforms string input to branded VersionId type.
 */
export const VersionIdSchema = TrimmedString.transform((v) => v as VersionId);
