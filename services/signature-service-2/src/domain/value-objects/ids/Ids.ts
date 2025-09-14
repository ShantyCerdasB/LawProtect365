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

import { z, UuidV4, TrimmedString } from "@lawprotect/shared-ts";
import type { Brand } from "@lawprotect/shared-ts";

/* ----------------------------------------------------------------------------
 * Brands
 * ----------------------------------------------------------------------------*/

/** @description Envelope identifier (UUID) */
export type EnvelopeId = Brand<string, "EnvelopeId">;
/** @description Document identifier (UUID) */
export type DocumentId = Brand<string, "DocumentId">;
/** @description Party identifier (UUID) */
export type PartyId = Brand<string, "PartyId">;
/** @description Input (field) identifier (UUID) */
export type InputId = Brand<string, "InputId">;
/** @description Signature record identifier (UUID) */
export type SignatureId = Brand<string, "SignatureId">;
/** @description Consent identifier (UUID) */
export type ConsentId = Brand<string, "ConsentId">;

/** @description User identifier (trimmed, non-empty) */
export type UserId = Brand<string, "UserId">;
/** @description IP address (IPv4 or IPv6) */
export type IpAddress = Brand<string, "IpAddress">;

/* ----------------------------------------------------------------------------
 * Schemas
 * ----------------------------------------------------------------------------*/

/**
 * @description Generic schema for entity identifiers using UUIDv4.
 * Useful for path/query params and shared VO usage.
 */
export const EntityIdSchema = UuidV4;

/** @description EnvelopeId validator (UUID ? brand) */
export const EnvelopeIdSchema = EntityIdSchema.transform(
  (v: string) => v as EnvelopeId
);
/** @description DocumentId validator (UUID ? brand) */
export const DocumentIdSchema = EntityIdSchema.transform(
  (v: string) => v as DocumentId
);
/** @description PartyId validator (UUID ? brand) */
export const PartyIdSchema = EntityIdSchema.transform(
  (v: string) => v as PartyId
);
/** @description InputId validator (UUID ? brand) */
export const InputIdSchema = EntityIdSchema.transform(
  (v: string) => v as InputId
);
/** @description SignatureId validator (UUID ? brand) */
export const SignatureIdSchema = EntityIdSchema.transform(
  (v: string) => v as SignatureId
);
/** @description ConsentId validator (UUID ? brand) */
export const ConsentIdSchema = EntityIdSchema.transform(
  (v: string) => v as ConsentId
);

/**
 * @description UserId validator.
 * Uses a trimmed string piped into a length constraint to avoid chaining
 * `.min` directly on a ZodEffects instance.
 */
export const UserIdSchema = TrimmedString.pipe(z.string().min(1)).transform(
  (v: string) => v as UserId
);

/** @description IpAddress validator (IPv4/IPv6 ? brand) */
export const IpAddressSchema = z.string().ip().transform(
  (v: string) => v as IpAddress
);

