import { z } from "@lawprotect/shared-ts";
import type { Brand } from "@lawprotect/shared-ts";

/**
 * Branded identifier types for domain entities.
 */
export type EnvelopeId = Brand<string, "EnvelopeId">;
export type DocumentId = Brand<string, "DocumentId">;
export type PartyId = Brand<string, "PartyId">;
export type InputId = Brand<string, "InputId">;
export type SignatureId = Brand<string, "SignatureId">;

export type TenantId = Brand<string, "TenantId">;
export type UserId = Brand<string, "UserId">;

/**
 * Common ULID/UUID schema.
 */
const UlidOrUuid = z
  .string()
  .regex(
    /^(?:[0-9A-HJKMNP-TV-Z]{26}|[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i,
    "Expected ULID or UUID"
  );

/**
 * Branded id schemas.
 */
export const EnvelopeIdSchema = UlidOrUuid.transform((v) => v as EnvelopeId);
export const DocumentIdSchema = UlidOrUuid.transform((v) => v as DocumentId);
export const PartyIdSchema = UlidOrUuid.transform((v) => v as PartyId);
export const InputIdSchema = UlidOrUuid.transform((v) => v as InputId);
export const SignatureIdSchema = UlidOrUuid.transform((v) => v as SignatureId);

export const TenantIdSchema = z.string().min(1).transform((v) => v as TenantId);
export const UserIdSchema = z.string().min(1).transform((v) => v as UserId);

/**
 * Safe casters from unknown strings.
 */
export const asEnvelopeId = (v: string): EnvelopeId => EnvelopeIdSchema.parse(v);
export const asDocumentId = (v: string): DocumentId => DocumentIdSchema.parse(v);
export const asPartyId = (v: string): PartyId => PartyIdSchema.parse(v);
export const asInputId = (v: string): InputId => InputIdSchema.parse(v);
export const asSignatureId = (v: string): SignatureId => SignatureIdSchema.parse(v);
export const asTenantId = (v: string): TenantId => TenantIdSchema.parse(v);
export const asUserId = (v: string): UserId => UserIdSchema.parse(v);
