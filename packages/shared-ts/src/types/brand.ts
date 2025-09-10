/**
 * Compile-time nominal typing helper (branding).
 * Prevents accidental mixing of semantically different strings/numbers.
 *
 * @typeParam T Base primitive type (string | number).
 * @typeParam Tag Unique tag name to brand with.
 */
export type Brand<T, Tag extends string> = T & { readonly __brand: Tag };

/** Branded identifiers commonly used across services. */
export type UserId = Brand<string, "UserId">;
export type CaseId = Brand<string, "CaseId">;
export type DocumentId = Brand<string, "DocumentId">;
export type TemplateId = Brand<string, "TemplateId">;
