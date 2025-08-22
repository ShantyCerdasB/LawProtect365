/**
 * @file Ids.ts
 * @summary Branded identifiers and Zod schemas for core domain entities.
 *
 * @description
 * Provides compile-time nominal typing (branding) for identifiers and
 * reusable Zod schemas to validate and normalize incoming values. Brands
 * prevent accidental mixing of semantically distinct strings while remaining
 * zero-cost at runtime.
 */

import { z, Ulid, UuidV4, TrimmedString } from "@lawprotect/shared-ts";
import type { Brand } from "@lawprotect/shared-ts";

/* ────────────────────────────────────────────────────────────────────────────
 * Brands
 * ────────────────────────────────────────────────────────────────────────────*/

/** Envelope identifier (ULID/UUID). */
export type EnvelopeId = Brand<string, "EnvelopeId">;
/** Document identifier (ULID/UUID). */
export type DocumentId = Brand<string, "DocumentId">;
/** Party identifier (ULID/UUID). */
export type PartyId = Brand<string, "PartyId">;
/** Input (field) identifier (ULID/UUID). */
export type InputId = Brand<string, "InputId">;
/** Signature record identifier (ULID/UUID). */
export type SignatureId = Brand<string, "SignatureId">;

/** Tenant identifier (trimmed, non-empty). */
export type TenantId = Brand<string, "TenantId">;
/** User identifier (trimmed, non-empty). */
export type UserId = Brand<string, "UserId">;

/* ────────────────────────────────────────────────────────────────────────────
 * Schemas
 * ────────────────────────────────────────────────────────────────────────────*/

/**
 * Generic schema for entity identifiers that accept either ULID or UUIDv4.
 * Useful for path/query params and shared VO usage.
 */
export const EntityIdSchema = z.union([Ulid, UuidV4]);

/** EnvelopeId validator (ULID/UUID → brand). */
export const EnvelopeIdSchema = EntityIdSchema.transform(
  (v: string) => v as EnvelopeId
);
/** DocumentId validator (ULID/UUID → brand). */
export const DocumentIdSchema = EntityIdSchema.transform(
  (v: string) => v as DocumentId
);
/** PartyId validator (ULID/UUID → brand). */
export const PartyIdSchema = EntityIdSchema.transform(
  (v: string) => v as PartyId
);
/** InputId validator (ULID/UUID → brand). */
export const InputIdSchema = EntityIdSchema.transform(
  (v: string) => v as InputId
);
/** SignatureId validator (ULID/UUID → brand). */
export const SignatureIdSchema = EntityIdSchema.transform(
  (v: string) => v as SignatureId
);

/**
 * TenantId validator.
 * Uses a trimmed string piped into a length constraint to avoid chaining
 * `.min` directly on a ZodEffects instance.
 */
export const TenantIdSchema = TrimmedString.pipe(z.string().min(1)).transform(
  (v: string) => v as TenantId
);
/**
 * UserId validator.
 * Uses a trimmed string piped into a length constraint to avoid chaining
 * `.min` directly on a ZodEffects instance.
 */
export const UserIdSchema = TrimmedString.pipe(z.string().min(1)).transform(
  (v: string) => v as UserId
);
