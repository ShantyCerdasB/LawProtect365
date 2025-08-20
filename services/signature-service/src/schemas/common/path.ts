/**
 * @file Path.ts
 * @summary Reusable Zod schemas for common path params.
 */

import { z } from "@lawprotect/shared-ts";
import { UuidV4, Ulid, OpaqueId } from "@lawprotect/shared-ts";
import { PositiveIntSchema } from "@lawprotect/shared-ts";

/** Envelope ids can be UUIDv4 or ULID (choose what your domain emits). */
export const EnvelopeId = z.union([UuidV4, Ulid]);

/** Document ids inside envelope — UUIDv4 or ULID. */
export const DocumentId = z.union([UuidV4, Ulid]);

/** Input id (field) — UUIDv4 or ULID. */
export const InputId = z.union([UuidV4, Ulid]);

/** Party id — UUIDv4 or ULID. */
export const PartyId = z.union([UuidV4, Ulid]);

/** Public signing token (opaque). */
export const SigningToken = OpaqueId;

/** /envelopes/{id} */
export const EnvelopeIdPath = z.object({
  id: EnvelopeId,
});
export type EnvelopeIdPath = z.infer<typeof EnvelopeIdPath>;

/** /envelopes/{id}/documents/{docId} */
export const EnvelopeDocPath = z.object({
  id: EnvelopeId,
  docId: DocumentId,
});
export type EnvelopeDocPath = z.infer<typeof EnvelopeDocPath>;

/** /envelopes/{id}/inputs/{inputId} */
export const EnvelopeInputPath = z.object({
  id: EnvelopeId,
  inputId: InputId,
});
export type EnvelopeInputPath = z.infer<typeof EnvelopeInputPath>;

/** /envelopes/{id}/parties/{partyId} */
export const EnvelopePartyPath = z.object({
  id: EnvelopeId,
  partyId: PartyId,
});
export type EnvelopePartyPath = z.infer<typeof EnvelopePartyPath>;

/** /envelopes/{id}/parties/{partyId}/delegate */
export const EnvelopePartyDelegatePath = EnvelopePartyPath;
export type EnvelopePartyDelegatePath = z.infer<typeof EnvelopePartyDelegatePath>;

/** /signing/{token} */
export const SigningTokenPath = z.object({
  token: SigningToken,
});
export type SigningTokenPath = z.infer<typeof SigningTokenPath>;

/** /documents/{id}/certificate */
export const StandaloneDocumentIdPath = z.object({
  id: DocumentId,
});
export type StandaloneDocumentIdPath = z.infer<typeof StandaloneDocumentIdPath>;

/** /envelopes/{id}/documents/{docId}/pages/{pageNo} */
export const EnvelopeDocPagePath = EnvelopeDocPath.extend({
  pageNo: PositiveIntSchema,
});
export type EnvelopeDocPagePath = z.infer<typeof EnvelopeDocPagePath>;
