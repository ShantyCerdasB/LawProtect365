/**
 * @file Path.ts
 * @summary Reusable Zod schemas for common path params.
 */

import { z, UuidV4, Ulid, OpaqueId } from "@lawprotect/shared-ts";

/** Envelope ids can be UUIDv4 or ULID. */
export const EnvelopeId = z.union([UuidV4, Ulid]);

/** Document ids inside envelope — UUIDv4 or ULID. */
export const DocumentId = z.union([UuidV4, Ulid]);

/** Input id (field) — UUIDv4 or ULID. */
export const InputId = z.union([UuidV4, Ulid]);

/** Party id — UUIDv4 or ULID. */
export const PartyId = z.union([UuidV4, Ulid]);

/** Consent id — UUIDv4 or ULID. */
export const ConsentId = z.union([UuidV4, Ulid]);

/** Public signing token (opaque). */
export const SigningToken = OpaqueId;

/**
 * Path parameter schema for envelope ID
 */
export const EnvelopeIdPath = z.object({
  id: z.union([UuidV4, Ulid]),
});

/**
 * Path parameter schema for document ID
 */
export const DocumentIdPath = z.object({
  id: z.union([UuidV4, Ulid]),
});

/**
 * Path parameter schema for party ID
 */
export const PartyIdPath = z.object({
  id: z.union([UuidV4, Ulid]),
});

/**
 * Path parameter schema for envelope and document IDs
 */
export const EnvelopeDocPath = z.object({
  envelopeId: z.union([UuidV4, Ulid]),
  docId: z.union([UuidV4, Ulid]),
});

/**
 * Path parameter schema for envelope, document, and page numbers
 */
export const EnvelopeDocPagePath = z.object({
  envelopeId: z.union([UuidV4, Ulid]),
  docId: z.union([UuidV4, Ulid]),
  pageNo: z.coerce.number().int().positive(),
});

/** /envelopes/{id}/inputs/{inputId} */
export const EnvelopeInputPath = z.object({ id: EnvelopeId, inputId: InputId });
export type EnvelopeInputPath = z.infer<typeof EnvelopeInputPath>;

/** /envelopes/{id}/parties/{partyId} */
export const EnvelopePartyPath = z.object({ id: EnvelopeId, partyId: PartyId });
export type EnvelopePartyPath = z.infer<typeof EnvelopePartyPath>;

/** /envelopes/{envelopeId}/consents/{consentId} */
export const EnvelopeConsentPath = z.object({
  envelopeId: EnvelopeId,
  consentId: ConsentId,
});
export type EnvelopeConsentPath = z.infer<typeof EnvelopeConsentPath>;

/** /envelopes/{id}/parties/{partyId}/delegate */
export const EnvelopePartyDelegatePath = EnvelopePartyPath;
export type EnvelopePartyDelegatePath = z.infer<typeof EnvelopePartyDelegatePath>;

/** /signing/{token} */
export const SigningTokenPath = z.object({ token: SigningToken });
export type SigningTokenPath = z.infer<typeof SigningTokenPath>;

/** /documents/{id}/certificate */
export const StandaloneDocumentIdPath = z.object({ id: DocumentId });
export type StandaloneDocumentIdPath = z.infer<typeof StandaloneDocumentIdPath>;
